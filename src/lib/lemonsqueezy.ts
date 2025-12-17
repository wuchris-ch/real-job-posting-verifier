import crypto from "crypto";

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export interface LemonSqueezyOrder {
  meta: {
    event_name: string;
  };
  data: {
    id: string;
    attributes: {
      user_email: string;
      user_name: string;
      status: string;
      total: number;
      created_at: string;
    };
  };
}

export async function createCheckoutUrl(
  email: string,
  userId: string
): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const productId = process.env.LEMONSQUEEZY_PRODUCT_ID;

  // LemonSqueezy checkout URL format
  // See: https://docs.lemonsqueezy.com/help/checkout/passing-custom-data
  const checkoutUrl = new URL(
    `https://checkout.lemonsqueezy.com/checkout/buy/${productId}`
  );

  // Pre-fill email
  checkoutUrl.searchParams.set("checkout[email]", email);

  // Pass custom data to identify the user
  checkoutUrl.searchParams.set("checkout[custom][user_id]", userId);

  // Disable discount code field for cleaner checkout
  checkoutUrl.searchParams.set("discount", "0");

  return checkoutUrl.toString();
}
