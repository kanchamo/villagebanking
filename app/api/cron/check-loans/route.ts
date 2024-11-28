import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAfter } from "date-fns";

export async function GET() {
  try {
    // Find all active loans
    const activeLoans = await prisma.loan.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        borrower: true,
        group: true,
      },
    });

    const now = new Date();
    const overdueLoans = activeLoans.filter((loan) => isAfter(now, loan.dueDate));

    // Update overdue loans and create notifications
    for (const loan of overdueLoans) {
      await prisma.$transaction([
        // Update loan status
        prisma.loan.update({
          where: { id: loan.id },
          data: { status: "OVERDUE" },
        }),
        // Create notification for borrower
        prisma.notification.create({
          data: {
            type: "LOAN_OVERDUE",
            userId: loan.borrower.userId,
            title: "Loan Payment Overdue",
            message: `Your loan payment of $${(loan.amount + loan.interest - loan.paidAmount).toLocaleString()} is overdue`,
            metadata: {
              loanId: loan.id,
              groupId: loan.groupId,
              dueDate: loan.dueDate,
              remainingAmount: loan.amount + loan.interest - loan.paidAmount,
            },
          },
        }),
        // Create notification for group admin
        prisma.notification.create({
          data: {
            type: "LOAN_OVERDUE",
            userId: loan.group.adminId,
            title: "Loan Payment Overdue",
            message: `Loan payment from ${loan.borrower.userId} is overdue`,
            metadata: {
              loanId: loan.id,
              groupId: loan.groupId,
              borrowerId: loan.borrowerId,
              dueDate: loan.dueDate,
              remainingAmount: loan.amount + loan.interest - loan.paidAmount,
            },
          },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      overdueLoansCount: overdueLoans.length,
    });
  } catch (error) {
    console.error("Error checking overdue loans:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
