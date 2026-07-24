import { validateEnv } from "../src/utilities/validateEnv";

describe("validateEnv", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it("does not enforce required variables outside production", () => {
        process.env.NODE_ENV = "dev";
        delete process.env.DATABASE_URL;

        expect(() => validateEnv()).not.toThrow();
    });

    it("does not enforce required variables in the test environment", () => {
        process.env.NODE_ENV = "test";
        delete process.env.DATABASE_URL;

        expect(() => validateEnv()).not.toThrow();
    });

    it("throws when a required production variable is missing", () => {
        process.env.NODE_ENV = "production";
        delete process.env.DATABASE_URL;

        expect(() => validateEnv()).toThrow(/DATABASE_URL/);
    });

    it("throws when a required production variable is set but empty", () => {
        process.env.NODE_ENV = "production";
        process.env.DATABASE_URL = "   ";

        expect(() => validateEnv()).toThrow(/DATABASE_URL/);
    });

    it("does not throw when every required production variable is present", () => {
        process.env.NODE_ENV = "production";
        process.env.DATABASE_URL = "mysql://user:pass@host:3306/db";

        expect(() => validateEnv()).not.toThrow();
    });
});
