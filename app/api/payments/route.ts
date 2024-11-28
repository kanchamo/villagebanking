import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { groupId, amount, notes, loanId } = await req.json();

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: loanId ? "Loan Payment" : "Group Contribution",
              description: loanId 
                ? "Payment towards your loan" 
                : "Contribution to your village banking group",
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/groups/${groupId}?payment=success${loanId ? `&loanId=${loanId}` : ''}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/groups/${groupId}?payment=cancelled`,
      metadata: {
        groupId,
        userId,
        notes: notes || "",
        loanId: loanId || "",
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating payment session:", error);
    return new NextResponse(
      `Failed to create payment session: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
