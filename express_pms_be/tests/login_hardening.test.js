import request from "supertest";
import app from "../app.js";
import { resetRateLimiterStore } from "../routes/v1/components/tools/rate_limiter.js";

describe("T4: Login Hardening, Rate Limiting & Uniform Errors", () => {
  beforeEach(() => {
    resetRateLimiterStore();
  });

  test("1. Non-existent username returns uniform 'Username atau password salah' with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("x-timestamp", new Date().toISOString())
      .send({
        username: "nonexistent_user_999@test.com",
        password: "SomePassword123!",
        remember_me: "0",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Username atau password salah");
    expect(res.body.status).toBe("01");
  });

  test("2. Existing user with wrong password returns identical uniform message with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("x-timestamp", new Date().toISOString())
      .send({
        username: "superadmin@admin.com",
        password: "DefinitelyWrongPassword123!",
        remember_me: "0",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Username atau password salah");
    expect(res.body.status).toBe("01");
  });

  test("3. Multiple failed attempts trigger rate limiter (429 Too Many Requests)", async () => {
    const testUsername = "ratelimit_target@test.com";

    // Lakukan 5 kali percobaan gagal berturut-turut
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .set("x-timestamp", new Date().toISOString())
        .send({
          username: testUsername,
          password: "WrongPassword!",
          remember_me: "0",
        });
      expect(res.statusCode).toBe(400);
    }

    // Percobaan ke-6 harus ditolak oleh rate limiter (HTTP 429)
    const blockedRes = await request(app)
      .post("/api/v1/auth/login")
      .set("x-timestamp", new Date().toISOString())
      .send({
        username: testUsername,
        password: "WrongPassword!",
        remember_me: "0",
      });

    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.body.message).toMatch(/terlalu banyak percobaan login gagal/i);
  });
});
