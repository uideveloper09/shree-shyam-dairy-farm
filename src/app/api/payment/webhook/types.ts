/** Successful Razorpay webhook acknowledgement. */
export interface RazorpayWebhookSuccessResponse {
  success: true;
}

/** Error response for invalid webhook requests. */
export interface RazorpayWebhookErrorResponse {
  success: false;
  error: string;
}

export type RazorpayWebhookResponse = RazorpayWebhookSuccessResponse | RazorpayWebhookErrorResponse;
