import { jest } from "@jest/globals";
import request from "supertest";
import { SignJWT } from "jose";
import app from "../app.js";
import { authorize } from "../middleware/authorize.js";

describe("T6: Role-Based Access Control (RBAC) Authorize Middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Unit Tests: authorize() Handler Logic", () => {
    test("1. Allows access when user role is in the allowed list", () => {
      const middleware = authorize("admin", "manager");
      const req = { auth: { role: "admin" } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("2. Rejects with HTTP 403 when user role is not authorized", () => {
      const middleware = authorize("admin", "corporate_manager");
      const req = { auth: { role: "housekeeping" } };
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const res = { status: statusMock };
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "01",
          message: "Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini",
        })
      );
    });

    test("3. Superadmin is ALWAYS allowed regardless of allowed list", () => {
      const middleware = authorize("auditor");
      const req = { auth: { role: "superadmin" } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("4. DEV role bypasses check in non-production with APP_DEBUG=true", () => {
      process.env.NODE_ENV = "development";
      process.env.APP_DEBUG = "true";

      const middleware = authorize("admin");
      const req = { auth: { role: "DEV" } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("5. DEV role is NOT bypassed in production environment", () => {
      process.env.NODE_ENV = "production";
      process.env.APP_DEBUG = "true";

      const middleware = authorize("admin");
      const req = { auth: { role: "DEV" } };
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const res = { status: statusMock };
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
    });

    test("6. Returns HTTP 401 if req.auth is missing or role is empty", () => {
      const middleware = authorize("admin");
      const req = { auth: null };
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const res = { status: statusMock };
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    test("7. Case-insensitive role comparison works (e.g. AdMiN == admin)", () => {
      const middleware = authorize("admin");
      const req = { auth: { role: "AdMiN" } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Integration Tests with JWT Authentication", () => {
    const createTokenForRole = async (role) => {
      const secretKey = new TextEncoder().encode(process.env.USER_SECRET);
      return await new SignJWT({
        user_id: 10,
        user_code: "USR0010",
        username: "test_rbac_user",
        role: role,
        company_id: 1,
        allowed_branch_ids: [1],
        allowed_kode_cabang: ["CAB0001"],
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secretKey);
    };

    test("8. Housekeeping role calling /setup/user-login/user-create is blocked with 403 Forbidden", async () => {
      const token = await createTokenForRole("housekeeping");

      const res = await request(app)
        .post("/api/v1/setup/user-login/user-create")
        .set("authorization", `Bearer ${token}`)
        .set("x-timestamp", new Date().toISOString())
        .send({ username: "newbie" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini");
      expect(res.body.status).toBe("01");
    });

    test("9. Admin role calling /setup/user-login/user-create passes RBAC check (not 403)", async () => {
      const token = await createTokenForRole("admin");

      const res = await request(app)
        .post("/api/v1/setup/user-login/user-create")
        .set("authorization", `Bearer ${token}`)
        .set("x-timestamp", new Date().toISOString())
        .send({});

      // Tidak boleh 403 Forbidden (mencapai validasi payload controller)
      expect(res.statusCode).not.toBe(403);
    });

    test("10. Admin role calling /setup/nav/mst-create is blocked with 403 (superadmin only)", async () => {
      const token = await createTokenForRole("admin");

      const res = await request(app)
        .post("/api/v1/setup/nav/mst-create")
        .set("authorization", `Bearer ${token}`)
        .set("x-timestamp", new Date().toISOString())
        .send({ role: "kasir" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini");
    });

    test("11. Superadmin role calling /setup/nav/mst-create passes RBAC check (not 403)", async () => {
      const token = await createTokenForRole("superadmin");

      const res = await request(app)
        .post("/api/v1/setup/nav/mst-create")
        .set("authorization", `Bearer ${token}`)
        .set("x-timestamp", new Date().toISOString())
        .send({});

      expect(res.statusCode).not.toBe(403);
    });
  });
});
