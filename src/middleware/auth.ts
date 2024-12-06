import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export async function verifyAuth(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        return decoded as { userId: number };
    } catch (error) {
        console.error('JWT Verification Error:', error);
        return null;
    }
}
