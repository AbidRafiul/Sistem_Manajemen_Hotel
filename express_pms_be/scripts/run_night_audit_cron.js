/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file run_night_audit_cron.js
 * @description Standalone CLI script to trigger Night Audit via cron or Task Scheduler
 *              Usage: node scripts/run_night_audit_cron.js [--branch=CAB0001] [--force]
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import {
  runScheduledAuditForBranch,
  runScheduledAuditForAllBranches,
  getSchedulerStatus
} from "../routes/v1/components/tools/night_audit_scheduler.js";

const args = process.argv.slice(2);
const forceArg = args.includes("--force");
const branchArg = args.find((a) => a.startsWith("--branch="))?.split("=")[1];

console.log("=== HOTEL PMS NIGHT AUDIT CRON TRIGGER ===");
console.log(`Arguments: force=${forceArg}, branch=${branchArg || "ALL"}`);

const main = async () => {
  try {
    if (branchArg) {
      const res = await runScheduledAuditForBranch(branchArg, forceArg);
      console.log("Result:", JSON.stringify(res, null, 2));
    } else {
      const res = await runScheduledAuditForAllBranches(forceArg);
      console.log("Batch Results:", JSON.stringify(res, null, 2));
    }

    const status = await getSchedulerStatus();
    console.log("Current Scheduler Status:", JSON.stringify(status, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Fatal Cron Error:", err);
    process.exit(1);
  }
};

main();
