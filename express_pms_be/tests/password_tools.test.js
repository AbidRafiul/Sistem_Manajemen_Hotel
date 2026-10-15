import crypto from "crypto";
import { hashPassword, verifyPassword, dummyVerifyPassword } from "../routes/v1/components/tools/password_tools.js";

describe("T3: Password Hashing & Verification (password_tools.js)", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      USER_KEY: "secret_user_key_16",
      USER_SECRET: "secret_jwt_user_secret_32_characters",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("1. hashPassword generates a valid bcrypt hash with salt factor 12", async () => {
    const plain = "SuperSecret123!";
    const hash = await hashPassword(plain);

    expect(hash).toMatch(/^\$2b\$12\$/);
    expect(hash.length).toBe(60);
  });

  test("2. verifyPassword validates a Bcrypt hash correctly", async () => {
    const plain = "CorrectPassword123!";
    const hash = await hashPassword(plain);

    const matchResult = await verifyPassword(plain, hash);
    expect(matchResult.isMatch).toBe(true);
    expect(matchResult.needsRehash).toBe(false);

    const wrongResult = await verifyPassword("WrongPassword!", hash);
    expect(wrongResult.isMatch).toBe(false);
    expect(wrongResult.needsRehash).toBe(false);
  });

  test("3. verifyPassword supports lazy migration for legacy HMAC-SHA512 hashes", async () => {
    const userCode = "USR0001";
    const plain = "LegacyPass123!";
    const input = process.env.USER_KEY + userCode + plain;
    const legacyHash = crypto.createHmac("sha512", process.env.USER_SECRET).update(input).digest("hex");

    expect(legacyHash.length).toBe(128); // 128 hex characters

    // Valid legacy password
    const result = await verifyPassword(plain, legacyHash, userCode);
    expect(result.isMatch).toBe(true);
    expect(result.needsRehash).toBe(true);

    // Invalid legacy password
    const wrongResult = await verifyPassword("WrongPass!", legacyHash, userCode);
    expect(wrongResult.isMatch).toBe(false);
    expect(wrongResult.needsRehash).toBe(false);
  });

  test("4. dummyVerifyPassword executes timing protection safely", async () => {
    await expect(dummyVerifyPassword("test_dummy")).resolves.not.toThrow();
  });
});
