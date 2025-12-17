import { createClient } from "@/lib/supabase/server";
import { createCheckoutUrl } from "@/lib/lemonsqueezy";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if already paid
  const { data: profile } = await supabase
    .from("profiles")
    .select("has_paid")
    .eq("id", user.id)
    .single();

  const profileData = profile as { has_paid: boolean } | null;
  if (profileData?.has_paid) {
    return NextResponse.json(
      { error: "Already have access", redirect: "/jobs" },
      { status: 400 }
    );
  }

  // Create checkout URL
  const checkoutUrl = await createCheckoutUrl(user.email!, user.id);

  return NextResponse.json({ url: checkoutUrl });
}
