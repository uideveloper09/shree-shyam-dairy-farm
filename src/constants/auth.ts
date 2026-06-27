export const AUTH_COOKIE = {
  access: "ssd_access",
  refresh: "ssd_refresh",
  csrf: "ssd_csrf",
} as const;

export const TOKEN_TTL = {
  access: process.env.JWT_ACCESS_EXPIRES || "15m",
  refresh: process.env.JWT_REFRESH_EXPIRES || "7d",
  refreshRemember: process.env.JWT_REFRESH_REMEMBER_EXPIRES || "30d",
  emailVerify: 24 * 60 * 60, // seconds
  resetPassword: 60 * 60,
  otp: 10 * 60,
} as const;

export const GUEST_CART_KEY = "ssd_guest_cart_id";
