import request from "supertest";
import app from "../app.js";

describe("T8: Security Headers & Upload Hardening Tests", () => {
  test("1. Returns strict modern security headers on API responses", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("x-timestamp", new Date().toISOString())
      .send({});

    // Strict Transport Security (HSTS)
    expect(res.headers["strict-transport-security"]).toBe(
      "max-age=31536000; includeSubDomains"
    );

    // MIME sniffing prevention
    expect(res.headers["x-content-type-options"]).toBe("nosniff");

    // Clickjacking protection
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");

    // Referrer policy
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

    // Modern API Content Security Policy (no third party trackers)
    const csp = res.headers["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("twitter.com");
    expect(csp).not.toContain("plausible.io");
    expect(csp).not.toContain("youtube.com");

    // Deprecated Expect-CT must NOT be present
    expect(res.headers["expect-ct"]).toBeUndefined();

    // Fingerprinting headers removed
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["server"]).toBeUndefined();
  });
});
