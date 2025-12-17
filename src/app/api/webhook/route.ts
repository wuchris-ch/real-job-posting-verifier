import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature, LemonSqueezyOrder } from "@/lib/lemonsqueezy";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const signature = request.headers.get("x-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  // Verify webhook signature
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const isValid = verifyWebhookSignature(rawBody, signature, secret);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: LemonSqueezyOrder = JSON.parse(rawBody);

  // Only process order_created events
  if (payload.meta.event_name !== "order_created") {
    return NextResponse.json({ received: true });
  }

  const email = payload.data.attributes.user_email;

  // Use admin client to bypass RLS
  const supabase = createAdminClient();

  // Find user by email and mark as paid
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (findError || !profile) {
    console.error("User not found for email:", email);
    // Still return 200 to acknowledge receipt
    return NextResponse.json({ received: true, warning: "User not found" });
  }

  // Update user payment status
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      has_paid: true,
      paid_at: new Date().toISOString(),
      lemonsqueezy_customer_id: payload.data.id,
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Error updating profile:", updateError);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
