import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { userId } = getAuth(req)

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User not authenticated' },
                { status: 401 }
            )
        }

        const { chatId, name } = await req.json()

        await connectDB()

        await Chat.findOneAndUpdate({ _id: chatId, userId }, { name })

        return NextResponse.json({ success: true, message: 'Chat Renamed' })
    } catch (error) {
        console.error('POST /api/Chat/Rename error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}