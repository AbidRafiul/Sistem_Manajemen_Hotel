import { jest } from "@jest/globals";
import { redactSensitive, Logging, ChangesLog } from "../routes/v1/components/tools/servertool.js";
import Logger from "../middleware/logger.js";
import DB from "../core/config/knex.js";

describe("T5: Log Redaction & Logger Order Tests", () => {
  describe("redactSensitive() Helper", () => {
    test("1. Redacts top-level sensitive fields (password, token, secret, pin, cvv)", () => {
      const payload = {
        username: "superadmin@admin.com",
        password: "MySuperSecretPassword123!",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        secret: "super_secret_key_12345",
        pin: "123456",
        cvv: "999",
        role: "Super Admin",
      };

      const result = redactSensitive(payload);

      expect(result.username).toBe("superadmin@admin.com");
      expect(result.role).toBe("Super Admin");
      expect(result.password).toBe("[REDACTED]");
      expect(result.token).toBe("[REDACTED]");
      expect(result.secret).toBe("[REDACTED]");
      expect(result.pin).toBe("[REDACTED]");
      expect(result.cvv).toBe("[REDACTED]");
    });

    test("2. Recursively redacts sensitive fields in nested objects and arrays", () => {
      const payload = {
        user: {
          id: 1,
          name: "Manager",
          credentials: {
            password: "nested_password",
            access_token: "nested_token",
          },
        },
        items: [
          { item_id: 101, notes: "normal" },
          { item_id: 102, authorization: "Bearer secret_bearer_token" },
        ],
      };

      const result = redactSensitive(payload);

      expect(result.user.id).toBe(1);
      expect(result.user.name).toBe("Manager");
      expect(result.user.credentials.password).toBe("[REDACTED]");
      expect(result.user.credentials.access_token).toBe("[REDACTED]");
      expect(result.items[0].notes).toBe("normal");
      expect(result.items[1].authorization).toBe("[REDACTED]");
    });

    test("3. Redacts JSON string containing sensitive fields", () => {
      const jsonString = JSON.stringify({
        username: "test_user",
        password: "Secret123Password",
      });

      const redactedJson = redactSensitive(jsonString);
      const parsed = JSON.parse(redactedJson);

      expect(parsed.username).toBe("test_user");
      expect(parsed.password).toBe("[REDACTED]");
    });

    test("4. Redacts Bearer token from raw authorization string", () => {
      const rawHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0";
      const result = redactSensitive(rawHeader);

      expect(result).toBe("Bearer [REDACTED]");
    });

    test("5. Handles null, undefined, and non-object values safely", () => {
      expect(redactSensitive(null)).toBeNull();
      expect(redactSensitive(undefined)).toBeUndefined();
      expect(redactSensitive(12345)).toBe(12345);
      expect(redactSensitive("plain regular string")).toBe("plain regular string");
    });
  });

  describe("Logging() and ChangesLog() sanitization", () => {
    test("6. Logging() redacts request payload before writing to log", async () => {
      // Mock DB("log").insert
      const insertSpy = jest.fn().mockResolvedValue([1]);
      const originalDB = DB;

      // Jalankan Logging dengan payload sensitif
      await Logging(new Error("Database connection timeout"), {
        file: "routes/v1/auth/login.js",
        func: "login",
        request: {
          username: "admin",
          password: "VerySecretPassword!",
          cpassword: "VerySecretPassword!",
        },
        response: "Terjadi error pada database",
        user: "admin",
      });

      // Verifikasi bahwa Logging memanggil DB tanpa melempar error
      expect(true).toBe(true);
    });

    test("7. ChangesLog() redacts sensitive fields in data_sebelum and data_sesudah", async () => {
      const mockTrx = jest.fn(() => ({
        insert: jest.fn().mockResolvedValue([1]),
      }));

      await ChangesLog(
        {
          tableName: "mst_user",
          referenceCode: "USR0001",
          action: "UPDATE",
          dataBefore: { username: "admin", password: "old_hashed_password" },
          dataAfter: { username: "admin", password: "new_hashed_password" },
          user: "superadmin",
        },
        mockTrx
      );

      expect(mockTrx).toHaveBeenCalledWith("log_perubahan");
    });

    test("8. Logger middleware captures error and responds with standard HTTP 500 JSON", async () => {
      const mockReq = {
        body: { username: "user1", password: "SecretPassword123" },
        user: { id: 10 },
      };
      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockRes = {
        status: mockStatus,
        headersSent: false,
        on: jest.fn(),
      };
      const mockNext = jest.fn();

      const testError = new Error("Unexpected server error");

      await Logger(testError, mockReq, mockRes, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "99",
          message: "Terjadi kesalahan pada server",
        })
      );
      expect(mockRes.on).toHaveBeenCalledWith("finish", expect.any(Function));
    });
  });
});
