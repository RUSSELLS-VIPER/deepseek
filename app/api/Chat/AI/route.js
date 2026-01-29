export const maxDuration = 60;
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const { chatId, prompt } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 },
      );
    }

    await connectDB();
    const chat = await Chat.findOne({ userId, _id: chatId });

    if (!chat) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 },
      );
    }

    const userPrompt = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };
    chat.messages.push(userPrompt);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    const message = {
      role: "assistant",
      content: completion.choices[0].message.content,
      timestamp: Date.now(),
    };

    chat.messages.push(message);
    await chat.save();

    return NextResponse.json({
      success: true,
      data: message, // Return the message object
    });
  } catch (error) {
    console.error("POST /api/Chat/AI error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
