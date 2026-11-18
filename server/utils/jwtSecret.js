const DEV_FALLBACK_SECRET = "dev_secret";

/**
 * Returns the secret used to sign and verify JWTs.
 *
 * In production a missing JWT_SECRET is a configuration error: falling back to
 * a well-known value would let anyone forge tokens, so we throw instead.
 * In development and tests a fixed fallback keeps local setup simple.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return DEV_FALLBACK_SECRET;
}

module.exports = { getJwtSecret };
