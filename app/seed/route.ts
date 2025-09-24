
// app/api/seed/route.ts
import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { NextResponse } from 'next/server';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

export const runtime = 'nodejs';
export const maxDuration = 60;

// If your POSTGRES_URL is Supabase's *pooled* connection string (pgbouncer),
// disable prepared statements and keep a tiny pool for serverless.
const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
  max: 1,
  idle_timeout: 5,
  prepare: false, // <-- critical with pgBouncer (transaction pooling)
});

type Tx = ReturnType<typeof postgres>; // rough type; ok to omit in JS

async function seedUsers(tx: any) {
  // Prefer pgcrypto; use uuid-ossp if you really need uuid_generate_v4()
  await tx`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
  await tx`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  // insert sequentially to keep a single connection happy
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await tx`
      INSERT INTO users (id, name, email, password)
      VALUES (${u.id}, ${u.name}, ${u.email}, ${hashed})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedCustomers(tx: any) {
  await tx`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
  await tx`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
  for (const c of customers) {
    await tx`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${c.id}, ${c.name}, ${c.email}, ${c.image_url})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedInvoices(tx: any) {
  await tx`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
  await tx`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
  for (const inv of invoices) {
    await tx`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${inv.customer_id}, ${inv.amount}, ${inv.status}, ${inv.date})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedRevenue(tx: any) {
  await tx`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  for (const r of revenue) {
    await tx`
      INSERT INTO revenue (month, revenue)
      VALUES (${r.month}, ${r.revenue})
      ON CONFLICT (month) DO NOTHING
    `;
  }
}

export async function GET() {
  try {
    await sql.begin(async (tx) => {
      // run inside ONE connection/transaction
      await seedUsers(tx);
      await seedCustomers(tx);
      await seedInvoices(tx);
      await seedRevenue(tx);
    });

    return NextResponse.json({ ok: true, message: 'Database seeded successfully' });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, code: err?.code, message: err?.message },
      { status: 500 }
    );
  }
}
