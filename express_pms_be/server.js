/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
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
import DB from "./core/config/knex.js";

const port = process.env.PORT || process.env.APP_PORT || 8010;

// Cleanup deprecated user_navigation table if still present
DB.schema.hasTable("user_navigation").then((exists) => {
  if (exists) {
    DB.schema.dropTable("user_navigation").then(() => {
      console.log("✅ Deprecated table user_navigation dropped successfully.");
    }).catch((err) => {
      console.error("Warning: failed to drop user_navigation table:", err.message);
    });
  }
}).catch(() => {});

app
  .listen(port, () => {
    console.log(`Server running on port ${port}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${port} is already in use`);
      process.exit(1);
    } else {
      throw err;
    }
  });
