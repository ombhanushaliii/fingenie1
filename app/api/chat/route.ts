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
    let { chatId } = body;
    let title = undefined;

    console.log(`[POST] Processing message for user: ${userId}, chatId: ${chatId || 'NEW'}`);

    if (!chatId) {
        chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        title = "New Chat";

        console.log(`[POST] Creating new conversation: ${chatId}`);

        try {
            const newChat = await Conversation.create({
                chatId,
                userId,
                title,
                messages: [{
                    messageId,
                    sender: 'user',
                    text: message,
                    timestamp: new Date(),
                }]
            });
            console.log(`[POST] Conversation created successfully:`, newChat._id);
        } catch (dbError: any) {
            console.error(`[POST] DB Creation Failed:`, dbError);
            return NextResponse.json({
                error: 'Database save failed',
                details: dbError.message
            }, { status: 500 });
        }
    } else {
        console.log(`[POST] Appending to conversation: ${chatId}`);
        try {
            let result = await Conversation.updateOne(
                { chatId, userId },
                {
                    $push: {
                        messages: {
                            messageId,
                            sender: 'user',
                            text: message,
                            timestamp: new Date(),
                        },
                    },
                }
            );

            // Fallback: If no doc matched (result.matchedCount === 0), try updating by _id
            if (result.matchedCount === 0) {
                console.log(`[POST] No match by chatId, trying _id: ${chatId}`);
                result = await Conversation.updateOne(
                    { _id: chatId, userId },
                    {
                        $push: {
                            messages: {
                                messageId,
                                sender: 'user',
                                text: message,
                                timestamp: new Date(),
                            },
                        },
                    }
                );
            }

            console.log(`[POST] Update result:`, result);
        } catch (dbError: any) {
            console.error(`[POST] DB Update Failed:`, dbError);
            return NextResponse.json({
                error: 'Database update failed',
                details: dbError.message
            }, { status: 500 });
        }
    }

    // Emit to Inngest
    await inngest.send({
        name: 'app/chat.message.received',
        data: { userId, messageId, text: message, chatId },
    });

    return NextResponse.json({ messageId, chatId, title, status: 'queued' });
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

    const chatId = url.searchParams.get("chatId");

    if (chatId) {
        console.log(`[GET] Fetching messages for chatId: ${chatId}`);
        let conversation = await Conversation.findOne({ chatId, userId });

        // Fallback: Try finding by _id for legacy chats
        if (!conversation) {
            try {
                conversation = await Conversation.findOne({ _id: chatId, userId });
            } catch (e) {
                console.log(`[GET] Not a valid ObjectId: ${chatId}`);
            }
        }

        return NextResponse.json({
            messages: conversation?.messages || []
        });
    } else {
        console.log(`[GET] Listing chats for userId: ${userId}`);
        const conversations = await Conversation.find({ userId })
            .select('chatId title updatedAt')
            .sort({ updatedAt: -1 });

        return NextResponse.json({
            chats: conversations
        });
    }
}
