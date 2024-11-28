import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function updateGroupAndMemberContributions(
  groupId: string,
  userId: string,
  amount: number,
  notes: string
) {
  // Start a transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Get the member record
    const member = await tx.member.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (!member) {
      throw new Error("Member not found");
    }

    // Create the contribution record
    await tx.contribution.create({
      data: {
        amount,
        notes,
        status: "COMPLETED",
        memberId: member.id,
        groupId,
      },
    });

    // Update member's total savings
    await tx.member.update({
      where: { id: member.id },
      data: {
        totalSavings: { increment: amount },
        lastPayment: new Date(),
      },
    });

    // Update group's total savings
    await tx.group.update({
      where: { id: groupId },
      data: {
        totalSavings: { increment: amount },
      },
    });
  });
}

async function processLoanPayment(
  metadata: { loanId: string; groupId: string; userId: string },
  amount: number
) {
  const loan = await prisma.loan.findUnique({
    where: { id: metadata.loanId },
    include: { borrower: true },
  });

  if (!loan) {
    throw new Error('Loan not found');
  }

  // Start a transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    // Create the loan payment record
    await tx.loanPayment.create({
      data: {
        amount,
        loanId: loan.id,
      },
    });

    // Update loan paid amount and status
    const updatedPaidAmount = loan.paidAmount + amount;
    const totalDue = loan.amount + loan.interest;
    
    await tx.loan.update({
      where: { id: loan.id },
      data: {
        paidAmount: updatedPaidAmount,
        status: updatedPaidAmount >= totalDue ? "PAID" : "ACTIVE",
      },
    });

    // Update group savings
    await tx.group.update({
      where: { id: metadata.groupId },
      data: {
        totalSavings: { increment: amount },
      },
    });

    // Create notification
    await tx.notification.create({
      data: {
        type: "LOAN_PAYMENT",
        userId: metadata.userId,
        title: "Loan Payment Processed",
        message: `Your loan payment of $${amount.toLocaleString()} has been processed successfully.`,
        metadata: {
          loanId: loan.id,
          groupId: metadata.groupId,
          amount,
          remainingAmount: totalDue - updatedPaidAmount,
        },
      },
    });
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata!;
      const amount = session.amount_total! / 100; // Convert from cents to dollars

      console.log("Processing completed checkout session:", {
        sessionId: session.id,
        metadata,
        amount,
      });

      if (metadata.loanId) {
        await processLoanPayment(metadata as any, amount);
      } else {
        await updateGroupAndMemberContributions(
          metadata.groupId,
          metadata.userId,
          amount,
          metadata.notes
        );

        // Create a notification for the contribution
        await prisma.notification.create({
          data: {
            type: "CONTRIBUTION",
            userId: metadata.userId,
            title: "Contribution Successful",
            message: `Your contribution of $${amount.toLocaleString()} has been processed successfully.`,
            metadata: {
              groupId: metadata.groupId,
              amount,
            },
          },
        });
      }

      console.log("Successfully processed payment and created notification");
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse(
      `Webhook handler failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
