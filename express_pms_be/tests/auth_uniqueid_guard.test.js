import request from "supertest";
import app from "../app.js";

describe("T2: Pagar Mekanisme X-UniqueId Guard Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("1. Di production, X-UniqueId tanpa Bearer token wajib 401 Unauthorized", async () => {
    process.env.NODE_ENV = "production";
    process.env.APP_DEBUG = "false";

    const res = await request(app)
      .post("/api/v1/setup/users/list")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000")
      .send({});

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/token tidak ditemukan/i);
  });

  test("2. Di production, X-UniqueId tetap 401 Unauthorized meskipun APP_DEBUG=true", async () => {
    process.env.NODE_ENV = "production";
    process.env.APP_DEBUG = "true";

    const res = await request(app)
      .post("/api/v1/setup/users/list")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000")
      .send({});

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/token tidak ditemukan/i);
  });

  test("3. Di non-production saat APP_DEBUG=false, X-UniqueId tanpa token harus 401 Unauthorized", async () => {
    process.env.NODE_ENV = "development";
    process.env.APP_DEBUG = "false";

    const res = await request(app)
      .post("/api/v1/setup/users/list")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000")
      .send({});

    expect(res.statusCode).toBe(401);
  });

  test("4. Di non-production saat APP_DEBUG=true, X-UniqueId aktif untuk kompatibilitas Postman standar", async () => {
    process.env.NODE_ENV = "development";
    process.env.APP_DEBUG = "true";

    const res = await request(app)
      .post("/api/v1/setup/users/list")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000")
      .send({});

    // Harus bypass autentikasi 401 dan mencapai route handler
    expect(res.statusCode).not.toBe(401);
  });
});
