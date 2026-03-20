import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const creds = [
  { email: 'admin@yzone.com',        password: 'admin123'        },
  { email: 'facilitator@yzone.com',  password: 'facilitator123'  },
  { email: 'faculty@yzone.com',      password: 'faculty123'      },
  { email: 'mentor@yzone.com',       password: 'mentor123'       },
  { email: 'alice@yzone.com',        password: 'student123'      },
  { email: 'bob@yzone.com',          password: 'student123'      },
  { email: 'carol@yzone.com',        password: 'student123'      },
];

(async () => {
  console.log('🔐 Verifying credentials...\n');
  for (const c of creds) {
    const r = await pool.query(
      'SELECT email, role, password_hash, is_active FROM users WHERE email = $1 AND deleted_at IS NULL',
      [c.email]
    );
    if (!r.rows.length) {
      console.log(`❌ NOT FOUND: ${c.email}`);
      continue;
    }
    const user = r.rows[0];
    const ok = await bcrypt.compare(c.password, user.password_hash);
    const status = ok ? '✅' : '❌';
    console.log(`${status} ${c.email.padEnd(28)} role: ${user.role.padEnd(18)} active: ${user.is_active} hash_ok: ${ok}`);
  }
  await pool.end();
})();
