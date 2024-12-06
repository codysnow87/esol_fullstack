import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import redisClient from '@/lib/redis';
//import { verifyAuth } from '@/middleware/auth';

type Message = {
    eventName: string;
    startTimestamp: string;
    endTimestamp: string;
    latitude: number;
    longitude: number;
};

// GET
export async function GET(req: NextRequest) {
    try {
        // TODO: Implement auth in client to pass in JWT, then activate here
        //const user = await verifyAuth(req);
        //if (!user) {
        //    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        //}

        const { searchParams } = new URL(req.url);
        const userId = parseInt(searchParams.get('userId') || '', 10);

        if (!userId) {
            return NextResponse.json({ error: 'Missing or invalid userId' }, { status: 400 });
        }

        // TODO: Make stored proc
        const messagesQuery = `
          SELECT m.*
          FROM messages m
          INNER JOIN user_messages um ON m.id = um.message_id
          WHERE um.user_id = $1
          ORDER BY m.start_timestamp DESC;
        `;
        const result = await pool.query(messagesQuery, [userId]);
        const messages = result.rows;

        return NextResponse.json({ data: messages }, { status: 200 });
    } catch (error) {
        console.error('Error retrieving messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST
export async function POST(req: NextRequest) {
    const CHANNEL = 'messages';

    try {
        const body = await req.json();
        const { eventName, startTimestamp, endTimestamp, latitude, longitude } = body as Message;

        // Basic validation
        if (
            !eventName ||
            !startTimestamp ||
            !endTimestamp ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        // TODO: Make a stored proc
        const insertQuery = `
          INSERT INTO messages (event_name, start_timestamp, end_timestamp, latitude, longitude)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
        `;

        const values = [eventName, startTimestamp, endTimestamp, latitude, longitude];

        // Save the message to the database
        const result = await pool.query(insertQuery, values);
        const savedMessage = result.rows[0];

        // Retrieve users subscribed to the topic
        const topic = CHANNEL; // TODO: differentiate between topic and channel
        // TODO: Make a stored proc
        const subscriptionsQuery = `
          SELECT user_id FROM subscriptions WHERE topic = $1;
        `;
        const subscriptionsResult = await pool.query(subscriptionsQuery, [topic]);
        const subscribedUserIds = subscriptionsResult.rows.map((row) => row.user_id);

        // Associate the message with each subscribed user
        // TODO: Make stored proc, optimize SQL
        const userMessagesInsertQuery = `
          INSERT INTO user_messages (user_id, message_id)
          SELECT user_id, $1 FROM unnest($2::int[]) AS user_id
          ON CONFLICT (user_id, message_id) DO NOTHING;
        `;
        await pool.query(userMessagesInsertQuery, [savedMessage.id, subscribedUserIds]);

        // Publish the message via Redis Pub/Sub
        const messagePayload = JSON.stringify(savedMessage);

        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        await redisClient.publish(CHANNEL, messagePayload);

        return NextResponse.json(
            { message: 'Message received and processed.', data: savedMessage },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error processing message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}