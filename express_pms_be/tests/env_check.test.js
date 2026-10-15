import { jest } from "@jest/globals";
import { validateEnvironment } from "../core/config/env_check.js";

describe("Environment Check - env_check.js", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Ensure base required variables exist for test suite
    process.env.ORIGIN = "http://localhost:3000";
    process.env.DB_DBMS = "mysql2";
    process.env.DB_HOST = "127.0.0.1";
    process.env.DB_USERNAME = "root";
    process.env.DB_DATABASE = "hotel_pms";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("should pass with warnings in development even if keys are shorter than 32 characters", () => {
    process.env.NODE_ENV = "development";
    process.env.USER_SECRET = "short_secret";
    process.env.USER_KEY = "short_key";
    process.env.USER_PAS_KEY = "any_pass_key";
    process.env.APP_DEBUG = "true";

    const res = validateEnvironment();
    expect(res.isValid).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  test("should detect error in production when APP_DEBUG=true", () => {
    process.env.NODE_ENV = "production";
    process.env.USER_SECRET = "12345678901234567890123456789012"; // 32 chars
    process.env.USER_KEY = "12345678901234567890123456789012";    // 32 chars
    process.env.USER_PAS_KEY = "non_empty_pass_key";
    process.env.APP_DEBUG = "true";

    const mockExit = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });

    expect(() => validateEnvironment()).toThrow("Process exited with code 1");
    mockExit.mockRestore();
  });

  test("should detect error in production when USER_SECRET or USER_KEY is shorter than 32 characters", () => {
    process.env.NODE_ENV = "production";
    process.env.USER_SECRET = "short_secret";
    process.env.USER_KEY = "short_key";
    process.env.USER_PAS_KEY = "non_empty_pass_key";
    process.env.APP_DEBUG = "false";

    const mockExit = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });

    expect(() => validateEnvironment()).toThrow("Process exited with code 1");
    mockExit.mockRestore();
  });

  test("should detect error when USER_PAS_KEY is missing or empty", () => {
    process.env.NODE_ENV = "development";
    process.env.USER_SECRET = "12345678901234567890123456789012";
    process.env.USER_KEY = "12345678901234567890123456789012";
    delete process.env.USER_PAS_KEY;

    const res = validateEnvironment();
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain("Variabel environment wajib 'USER_PAS_KEY' belum didefinisikan.");
  });

  test("should pass in production when all requirements are met (32-char keys, non-empty USER_PAS_KEY, APP_DEBUG=false)", () => {
    process.env.NODE_ENV = "production";
    process.env.USER_SECRET = "12345678901234567890123456789012"; // 32 chars
    process.env.USER_KEY = "12345678901234567890123456789012";    // 32 chars
    process.env.USER_PAS_KEY = "valid_pas_key"; // non-empty
    process.env.APP_DEBUG = "false";

    const res = validateEnvironment();
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });
});
