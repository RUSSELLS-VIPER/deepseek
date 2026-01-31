export const maxDuration = 60;
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { currentUser } from "@clerk/nextjs/server"; // CHANGED
import { NextResponse } from "next/server";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

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

    const { chatId, prompt } = await req.json();

    await connectDB();
    const data = await Chat.findOne({ userId, _id: chatId });

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 },
      );
    }

    const userPrompt = { role: "user", content: prompt, timestamp: Date.now() };
    data.messages.push(userPrompt);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    const message = {
      role: "assistant",
      content: completion.choices[0].message.content,
      timestamp: Date.now(),
    };
    data.messages.push(message);
    await data.save();

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("POST /api/Chat/AI error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
