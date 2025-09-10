/**
 * Environment variable validation utility
 * Helps identify missing or invalid environment variables on server deployment
 */

export const validateEnvironment = () => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  if (!process.env.MONGODB_URI) {
    errors.push("MONGODB_URI is required but not set");
  } else {
    // Validate MongoDB URI format
    if (
      !process.env.MONGODB_URI.startsWith("mongodb://") &&
      !process.env.MONGODB_URI.startsWith("mongodb+srv://")
    ) {
      errors.push(
        "MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'"
      );
    }
  }

  // Optional but recommended environment variables
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    warnings.push(
      "NEXT_PUBLIC_SITE_URL is not set - this may affect SEO and social sharing"
    );
  }

  if (!process.env.NODE_ENV) {
    warnings.push("NODE_ENV is not set - defaulting to 'development'");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const logEnvironmentStatus = () => {
  const validation = validateEnvironment();

  if (validation.errors.length > 0) {
    console.error("❌ Environment validation failed:");
    validation.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️ Environment warnings:");
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (validation.isValid && validation.warnings.length === 0) {
    console.log("✅ Environment validation passed");
  }

  return validation;
};
