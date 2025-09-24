import postgres from 'postgres';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });


export async function GET() {

try {
     await sql.begin(async (tx) => {
      // Disable statement timeout only inside this transaction
      await tx`SET LOCAL statement_timeout = 0`; // 0 = no timeout for this txn
      // Optional: avoid waiting forever on locks
      await tx`SET LOCAL lock_timeout = '3s'`;

      await tx`DROP TABLE IF EXISTS customers, invoices, revenue, users CASCADE`;
    });

    return NextResponse.json({ ok: true, message: 'Tables dropped' });
  } catch (err: any) {
    // Surface the real error instead of a generic 500
    return NextResponse.json(
      { ok: false, message: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
