import request from "supertest";
import { SignJWT } from "jose";
import app from "../app.js";
import { assertBranchScope } from "../routes/v1/components/tools/scope_helper.js";
import DB from "../core/config/knex.js";

describe("T7: Branch Isolation & Cross-Branch Security Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Unit Tests: assertBranchScope()", () => {
    test("1. Throws 403 when accessing a branch outside allowed_kode_cabang and allowed_branch_ids", () => {
      const mockReq = {
        auth: {
          allowed_kode_cabang: ["CAB0001"],
          allowed_branch_ids: [1],
        },
      };

      expect(() => {
        assertBranchScope(mockReq, "CAB0002");
      }).toThrow(/Akses ditolak: Cabang 'CAB0002' berada di luar scope/i);
    });

    test("2. Passes when accessing an authorized branch code or id", () => {
      const mockReq = {
        auth: {
          allowed_kode_cabang: ["CAB0001", "CAB0002"],
          allowed_branch_ids: [1, 2],
        },
      };

      expect(() => {
        assertBranchScope(mockReq, "CAB0001");
        assertBranchScope(mockReq, 2);
      }).not.toThrow();
    });

    test("3. Handles falsy target branch gracefully", () => {
      const mockReq = {
        auth: {
          allowed_kode_cabang: ["CAB0001"],
          allowed_branch_ids: [1],
        },
      };

      expect(() => {
        assertBranchScope(mockReq, null);
        assertBranchScope(mockReq, undefined);
      }).not.toThrow();
    });
  });

  describe("Integration Tests: Housekeeping Cross-Branch Isolation", () => {
    const createTokenForBranch = async (allowedBranches, role = "housekeeping") => {
      const secretKey = new TextEncoder().encode(process.env.USER_SECRET);
      return await new SignJWT({
        user_id: 15,
        user_code: "USR0015",
        username: "cabang1_staff",
        role: role,
        company_id: 1,
        allowed_branch_ids: allowedBranches.map((_, i) => i + 1),
        allowed_kode_cabang: allowedBranches,
        active_kode_cabang: allowedBranches[0],
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secretKey);
    };

    let testTaskIdCabang2 = null;

    beforeAll(async () => {
      // Buat dummy task di CAB0002 untuk pengujian cross-branch
      const existingTask = await DB("trx_housekeeping_task")
        .where("kode_cabang", "CAB0002")
        .where("is_active", 1)
        .first();

      if (existingTask) {
        testTaskIdCabang2 = existingTask.kode_housekeeping_task;
      }
    });

    test("4. User from CAB0001 requesting staff from CAB0002 is blocked with 403", async () => {
      const token = await createTokenForBranch(["CAB0001"]);

      const res = await request(app)
        .post("/api/v1/housekeeping/staff")
        .set("authorization", `Bearer ${token}`)
        .set("x-timestamp", new Date().toISOString())
        .send({ cabang: "CAB0002" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Akses ditolak: Cabang 'CAB0002' berada di luar scope/i);
    });

    test("5. User from CAB0001 requesting staff from CAB0001 is allowed (not 403)", async () => {
      const token = await createTokenForBranch(["CAB0001"]);

      const res = await request(app)
        .post("/api/v1/housekeeping/staff")
        .set("authorization", `Bearer ${token}`)
        .set("x-timestamp", new Date().toISOString())
        .send({ cabang: "CAB0001" });

      expect(res.statusCode).not.toBe(403);
    });

    test("6. User from CAB0001 attempting to start a task in CAB0002 is blocked with 403", async () => {
      if (!testTaskIdCabang2) return; // Skip if no task in CAB0002

      const token = await createTokenForBranch(["CAB0001"]);

      const res = await request(app)
        .post(`/api/v1/housekeeping/tasks/${testTaskIdCabang2}/start`)
        .set("authorization", `Bearer ${token}`)
        .set("x-timestamp", new Date().toISOString())
        .send({});

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Akses ditolak: Cabang 'CAB0002' berada di luar scope/i);
    });

    test("7. User from CAB0001 attempting to cancel a task in CAB0002 is blocked with 403", async () => {
      if (!testTaskIdCabang2) return;

      const token = await createTokenForBranch(["CAB0001"]);

      const res = await request(app)
        .post(`/api/v1/housekeeping/tasks/${testTaskIdCabang2}/cancel`)
        .set("authorization", `Bearer ${token}`)
        .set("x-timestamp", new Date().toISOString())
        .send({ cancel_reason: "Uji isolasi cabang" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Akses ditolak: Cabang 'CAB0002' berada di luar scope/i);
    });
  });
});
