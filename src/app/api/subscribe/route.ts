import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { userId, topic } = await req.json();

        if (!userId || !topic) { // TODO: topic validation needed
            return NextResponse.json({ error: 'Missing userId or topic' }, { status: 400 });
        }

        // TODO: Create stored proc
        const insertQuery = `
          INSERT INTO subscriptions (user_id, topic)
          VALUES ($1, $2)
          ON CONFLICT (user_id, topic) DO NOTHING
          RETURNING *;
        `;
        const values = [userId, topic];

        const result = await pool.query(insertQuery, values);
        const subscription = result.rows[0];

        return NextResponse.json(
            { message: 'Subscribed successfully', data: subscription },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error subscribing:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
