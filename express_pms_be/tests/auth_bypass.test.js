import request from "supertest";
import app from "../app.js";

describe("T2: Authentication & Debug Bypass Hardening", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("1. Request with x-uniqueid but without Bearer token must return 401 Unauthorized", async () => {
    delete process.env.DEV_AUTH_BYPASS;
    process.env.APP_DEBUG = "false";

    const res = await request(app)
      .post("/api/v1/setup/users/list")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000")
      .send({});

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/token/i);
  });

  test("2. Request with x-uniqueid must NOT bypass auth even if APP_DEBUG=true", async () => {
    process.env.APP_DEBUG = "true";
    delete process.env.DEV_AUTH_BYPASS;

    const res = await request(app)
      .post("/api/v1/setup/users/list")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000")
      .send({});

    expect(res.statusCode).toBe(401);
  });

  test("3. Request with x-uniqueid must NOT bypass auth in production even if DEV_AUTH_BYPASS=true", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_AUTH_BYPASS = "true";

    const res = await request(app)
      .post("/api/v1/setup/users/list")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000")
      .send({});

    expect(res.statusCode).toBe(401);
  });

  test("4. DEV_AUTH_BYPASS is active only when NODE_ENV=development and DEV_AUTH_BYPASS=true", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_AUTH_BYPASS = "true";

    const res = await request(app)
      .post("/api/v1/setup/users/list")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000")
      .send({});

    // Should bypass 401 and reach endpoint logic (returns 200)
    expect(res.statusCode).not.toBe(401);
  });
});
