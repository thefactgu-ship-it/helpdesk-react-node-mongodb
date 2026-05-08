/**
 * Validate required environment variables on server startup
 */
function validateEnv() {
  const requiredEnvs = [
    "MONGO_URI",
    "JWT_SECRET",
    "PORT",
  ];

  const missing = requiredEnvs.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  // Validate JWT_SECRET is strong enough (at least 32 characters)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn(
      "WARNING: JWT_SECRET is less than 32 characters. Consider using a stronger secret."
    );
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) {
      console.error(
        "ADMIN_PASSWORD must be set to at least 12 characters in production."
      );
      process.exit(1);
    }
  }

  console.log("All required environment variables are configured");
}

module.exports = validateEnv;
