import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { inngest } from '@/lib/inngest';

export async function POST(req: NextRequest) {
    const session = await getServerSession();

    // Auth Bypass for Development/Testing
    let userId = session?.user?.email;
    if (!userId && process.env.NODE_ENV === 'development') {
        userId = 'test-user@example.com';
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, source = 'text' } = await req.json();

    await inngest.send({
        name: 'app/transaction.input.received',
        data: { userId, rawInput: text, source },
    });

    return NextResponse.json({ status: 'queued' });
}
