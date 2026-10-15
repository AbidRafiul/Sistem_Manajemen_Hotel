import { assertBranchScope } from "../routes/v1/components/tools/scope_helper.js";

// Unit test (tanpa database). Integration test lintas cabang ada di
// branch_isolation.integration.test.js dan membutuhkan MySQL ber-seed.
describe("T7: Branch Isolation & Cross-Branch Security Tests", () => {
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
});
