import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string; loanId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { amount } = await req.json();

    // Get loan details
    const loan = await prisma.loan.findUnique({
      where: {
        id: params.loanId,
        groupId: params.groupId,
      },
      include: {
        borrower: true,
      },
    });

    if (!loan) {
      return new NextResponse("Loan not found", { status: 404 });
    }

    // Verify the user is the borrower
    if (loan.borrower.userId !== userId) {
      return new NextResponse("Unauthorized: Not the loan borrower", { status: 403 });
    }

    // Create payment record
    const payment = await prisma.loanPayment.create({
      data: {
        amount,
        loanId: loan.id,
      },
    });

    // Update loan paid amount and status
    const updatedPaidAmount = loan.paidAmount + amount;
    const totalDue = loan.amount + loan.interest;
    
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        paidAmount: updatedPaidAmount,
        status: updatedPaidAmount >= totalDue ? "PAID" : "ACTIVE",
      },
    });

    // Create notification for group admin
    await prisma.notification.create({
      data: {
        type: "LOAN_PAYMENT",
        userId: loan.borrower.userId,
        title: "Loan Payment Received",
        message: `Payment of $${amount.toLocaleString()} received for loan`,
        metadata: {
          loanId: loan.id,
          groupId: params.groupId,
          amount,
          remainingAmount: totalDue - updatedPaidAmount,
        },
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error processing loan payment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { groupId: string; loanId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payments = await prisma.loanPayment.findMany({
      where: {
        loanId: params.loanId,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching loan payments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
