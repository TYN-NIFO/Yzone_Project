import { pool } from "../src/config/db";
import * as bcrypt from "bcryptjs";

async function updateTestPasswords() {
  try {
    console.log("🔐 Updating test user passwords...");

    const users = [
      { email: "executive@yzone.com", password: "executive123" },
      { email: "facilitator@yzone.com", password: "facilitator123" },
      { email: "faculty@yzone.com", password: "faculty123" },
      { email: "mentor@yzone.com", password: "mentor123" },
      { email: "alice@yzone.com", password: "student123" },
    ];

    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      const result = await pool.query(
        "UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email",
        [hash, user.email]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ Updated password for ${user.email}`);
      } else {
        console.log(`⚠️  User not found: ${user.email}`);
      }
    }

    console.log("\n✅ All passwords updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating passwords:", error);
    process.exit(1);
  }
}

updateTestPasswords();
