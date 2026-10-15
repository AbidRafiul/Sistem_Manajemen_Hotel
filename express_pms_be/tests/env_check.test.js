import { jest } from "@jest/globals";
import { validateEnvironment } from "../core/config/env_check.js";

describe("Environment Check - env_check.js", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("should pass with warnings in development even if keys are short", () => {
    process.env.NODE_ENV = "development";
    process.env.USER_SECRET = "short";
    process.env.USER_KEY = "short";
    process.env.USER_PAS_KEY = "short";

    const res = validateEnvironment();
    expect(res.isValid).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  test("should detect errors in production when keys are insufficient or debug is on", () => {
    process.env.NODE_ENV = "production";
    process.env.USER_SECRET = "short_secret";
    process.env.USER_KEY = "short_key";
    process.env.USER_PAS_KEY = "short_pass";
    process.env.APP_DEBUG = "true";

    // Mock process.exit to prevent test runner from exiting
    const mockExit = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });

    expect(() => validateEnvironment()).toThrow("Process exited with code 1");
    mockExit.mockRestore();
  });

  test("should pass in production when all requirements are met", () => {
    process.env.NODE_ENV = "production";
    process.env.USER_SECRET = "12345678901234567890123456789012"; // 32 chars
    process.env.USER_KEY = "1234567890123456"; // 16 chars
    process.env.USER_PAS_KEY = "1234567890123456"; // 16 chars
    process.env.APP_DEBUG = "false";
    process.env.DEV_AUTH_BYPASS = "false";

    const res = validateEnvironment();
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });
});
