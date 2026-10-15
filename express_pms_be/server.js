/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file server.js
 * @description File untuk menjalankan server Express.js
 * 
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-07-14
 * 
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 * 
 * @lastModified Fadil (2026-08-03)
 * @version 1.0.1
 */


import app from "./app.js";
import { startNightAuditScheduler } from "./routes/v1/components/tools/night_audit_scheduler.js";
import validateEnvironment from "./core/config/env_check.js";

// Validasi environment variable penting sebelum listen
validateEnvironment();

const port = process.env.PORT || process.env.APP_PORT || 8010;

app
  .listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Start automated background scheduler for Night Audit
    try {
      startNightAuditScheduler();
    } catch (schedErr) {
      console.warn("Could not start night audit scheduler:", schedErr.message);
    }
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${port} is already in use`);
      process.exit(1);
    } else {
      throw err;
    }
  });
