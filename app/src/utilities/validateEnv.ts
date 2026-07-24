// Required environment variables for a production API process. Keep this list
// limited to variables the backend actually reads (see docs/operations/STAB_005_ENV_CONTRACT.md).
const REQUIRED_PRODUCTION_VARIABLES = ["DATABASE_URL"] as const;

export function validateEnv(): void {
    if (process.env.NODE_ENV !== "production") {
        return;
    }

    const missing = REQUIRED_PRODUCTION_VARIABLES.filter(
        (name) => !process.env[name] || process.env[name]?.trim() === "",
    );

    if (missing.length > 0) {
        // Names only — never log the value of an environment variable.
        throw new Error(
            `Missing required environment variable(s) for production: ${missing.join(", ")}`,
        );
    }
}
