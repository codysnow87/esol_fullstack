import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Fetch data from the Neon database
    const { rows } = await pool.query('SELECT id, name FROM resources');

    // Return rows as JSON
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
