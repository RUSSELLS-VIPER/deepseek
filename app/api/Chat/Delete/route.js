import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { auth } from "@clerk/nextjs/server"; // CHANGED
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = auth(); // CHANGED - No await needed

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 },
      );
    }

    const { chatId } = await req.json();
    await connectDB();
    await Chat.deleteOne({ _id: chatId, userId });
    return NextResponse.json({ success: true, message: "Chat Deleted" });
  } catch (error) {
    console.error("POST /api/Chat/Delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
