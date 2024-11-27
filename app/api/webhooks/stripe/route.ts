import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

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

export async function POST(req: Request) {
  const body = await req.text();
  const signature =  headers().get("Stripe-Signature") as string;

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

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
