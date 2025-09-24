import postgres from 'postgres';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function listInvoices() {
	const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

	return data;
}


export async function GET() {
  // return Response.json({
  //   message:
  //     'Uncomment this file and remove this line. You can delete this file when you are finished.',
  // });
  try {
  	return Response.json(await listInvoices());
  } catch (error) {
  	return Response.json({ error }, { status: 500 });
  }
// try {
//      await sql.begin(async (tx) => {
//       // Disable statement timeout only inside this transaction
//       await tx`SET LOCAL statement_timeout = 0`; // 0 = no timeout for this txn
//       // Optional: avoid waiting forever on locks
//       await tx`SET LOCAL lock_timeout = '3s'`;

//       await tx`DROP TABLE IF EXISTS customers, invoices, revenue, users CASCADE`;
//     });

//     return NextResponse.json({ ok: true, message: 'Tables dropped' });
//   } catch (err: any) {
//     // Surface the real error instead of a generic 500
//     return NextResponse.json(
//       { ok: false, message: err?.message ?? 'Unknown error' },
//       { status: 500 }
//     );
//   }
}
