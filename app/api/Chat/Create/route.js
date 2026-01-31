import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { currentUser } from "@clerk/nextjs/server"; // CHANGED
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const user = await currentUser(); // CHANGED
    const userId = user?.id; // CHANGED

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 },
      );
    }

    const chatData = { userId, messages: [], name: "New Chat" };
    await connectDB();
    await Chat.create(chatData);
    return NextResponse.json({ success: true, message: "Chat created" });
  } catch (error) {
    console.error("POST /api/Chat/Create error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
