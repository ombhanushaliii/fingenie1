import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { inngest } from '@/lib/inngest';
import dbConnect from '@/lib/db';
import { Conversation } from '@/lib/schemas';

import { authOptions } from '@/auth';

export async function POST(req: NextRequest) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { message } = body;

    // Auth Priority: Session > Client-side ID > Dev Fallback
    let userId = session?.user?.email || body.userId;

    if (!userId && process.env.NODE_ENV === 'development') {
        console.warn("Using test-user fallback. Session:", session, "Body userId:", body.userId);
        userId = 'test-user@example.com';
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store user message
    await Conversation.updateOne(
        { userId },
        {
            $push: {
                messages: {
                    messageId,
                    sender: 'user',
                    text: message,
                    timestamp: new Date(),
                },
            },
        },
        { upsert: true }
    );

    // Emit to Inngest
    await inngest.send({
        name: 'app/chat.message.received',
        data: { userId, messageId, text: message },
    });

    return NextResponse.json({ messageId, status: 'queued' });
}

export async function GET(req: NextRequest) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get("userId");

    // Auth Priority: Session > Query Param > Dev Fallback
    let userId = session?.user?.email || queryUserId;

    if (!userId && process.env.NODE_ENV === 'development') {
        userId = 'test-user@example.com';
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await Conversation.findOne({ userId });

    return NextResponse.json({
        messages: conversation?.messages || []
    });
}
