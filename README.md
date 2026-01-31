# DeepSeek AI Chatbot

A full-stack AI chatbot application built with **Next.js**, **React**, **MongoDB**, and **Clerk Authentication**. This project integrates with the **Groq API** (OpenAI-compatible) for intelligent AI responses, providing a modern chat interface with real-time message streaming.

## Project Overview

This is a comprehensive AI chatbot platform that allows users to:

- Create, rename, and delete chat conversations
- Send prompts and receive AI-generated responses in real-time
- Authenticate securely using Clerk
- Store chat history in MongoDB
- Enjoy a responsive, modern UI built with Tailwind CSS

**Tech Stack:**

- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB with Mongoose
- **Authentication:** Clerk
- **AI Provider:** Groq API (OpenAI-compatible)
- **UI/UX:** React Hot Toast, React Markdown, Prism.js for code highlighting
- **Styling:** Tailwind CSS with custom configuration

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The page auto-updates as you edit files.

---

## Environment Configuration

### Setup

- Copy `.env.example` to `.env.local` or `.env` (add to `.gitignore` if not already there).
- Replace placeholder values with your own credentials:
  - **GROQ_API_KEY**: Get from [Groq API](https://console.groq.com)
  - **MONGODB_URI**: MongoDB connection string
  - **CLERK_SECRET_KEY** & **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Get from [Clerk Dashboard](https://dashboard.clerk.com)

### Security Notes

- **Never commit `.env` to version control.** It's already in `.gitignore`.
- Keep secret keys (those without `NEXT_PUBLIC_` prefix) server-side only.
- If a key is exposed, rotate it immediately in its provider's dashboard.
- Test credentials (prefixed `sk_test_` or `pk_test_`) are for development; use production keys when deploying.

---

## Project Structure & Complete Code

### Configuration Files

#### `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
```

#### `jsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### `package.json`

```json
{
  "name": "deepseek",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.36.9",
    "axios": "^1.13.2",
    "mongoose": "^9.1.5",
    "next": "16.1.4",
    "openai": "^6.16.0",
    "prism": "^4.1.2",
    "prismjs": "^1.30.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-hot-toast": "^2.6.0",
    "react-markdown": "^10.1.0",
    "svix": "^1.84.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "babel-plugin-react-compiler": "1.0.0",
    "eslint": "^9",
    "eslint-config-next": "16.1.4",
    "tailwindcss": "^4"
  }
}
```

#### `middleware.ts` (Removed)

**Note:** `middleware.ts` has been removed in the latest version. Clerk middleware is now integrated directly into the application through ClerkProvider and the `auth()` function imported from `@clerk/nextjs`.

---

### Database Layer

#### `config/db.js` - MongoDB Connection

```javascript
import mongoose from "mongoose";

let cached = global.mongoose || { conn: null, promise: null };

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => mongoose);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
}
```

#### `models/Chat.js` - Chat Schema

```javascript
import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    messages: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Number, required: true },
      },
    ],
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

export default Chat;
```

#### `models/User.js` - User Schema

```javascript
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true },
);

const User = mongoose.model.User || mongoose.model("User", UserSchema);

export default User;
```

---

### Context & State Management

#### `context/AppContext.jsx` - Global State

```jsx
"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState(null);

  const createNewChat = async () => {
    try {
      if (!user) return null;
      const token = await getToken();

      await axios.post(
        "/api/Chat/Create",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      fetchUserChats();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchUserChats = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/Chat/Get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        setChats(data.data);
        if (data.data.length === 0) {
          await createNewChat();
          return fetchUserChats();
        } else {
          data.data.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
          );
          setSelectedChats(data.data[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserChats();
    }
  }, [user]);

  const value = {
    user,
    chats,
    setChats,
    selectedChats,
    setSelectedChats,
    fetchUserChats,
    createNewChat,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
```

---

### Layout & Pages

#### `app/layout.js` - Root Layout

```javascript
import { Inter } from "next/font/google";
import "./globals.css";
import "./prism.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "DeepSeek",
  description: "Full stack AI Chatbot",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <AppContextProvider>
        <html lang="en">
          <body className={`${inter.className} antialiased`}>
            <Toaster
              toastOptions={{
                success: { style: { background: "black", color: "white" } },
                error: { style: { background: "black", color: "white" } },
              }}
            />
            {children}
          </body>
        </html>
      </AppContextProvider>
    </ClerkProvider>
  );
}
```

#### `app/page.jsx` - Main Chat Page

```jsx
"use client";
import { assets } from "@/assets/assets";
import Message from "@/components/Message";
import PromptBox from "@/components/PromptBox";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [expand, setExpand] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedChat } = useAppContext();
  const containerRef = useRef(null);

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="h-screen bg-[#292a2d] text-white">
      <div className="flex h-full">
        <Sidebar expand={expand} setExpand={setExpand} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 relative">
          <div className="md:hidden absolute top-6 left-0 px-4 flex items-center justify-between w-full">
            <Image
              onClick={() => setExpand(!expand)}
              className="rotate-180 cursor-pointer"
              src={assets.menu_icon}
              alt=""
            />
            <Image className="opacity-70" src={assets.chat_icon} alt="" />
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3">
                <Image src={assets.logo_icon} alt="" className="h-16 w-auto" />
                <p className="text-2xl font-medium">Hi, I'm DeepSeek</p>
              </div>
              <p className="text-sm mt-2 opacity-80">
                How can I help you today?
              </p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative flex flex-col items-center justify-start w-full mt-20 max-h-screen overflow-y-auto"
            >
              <p className="fixed top-8 border border-transparent hover:border-gray-500/50 py-1 px-2 rounded-lg font-semibold mb-6">
                {selectedChat.name}
              </p>
              {messages.map((msg, index) => (
                <Message key={index} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex gap-4 max-w-3xl w-full py-3">
                  <Image
                    className="h-9 w-9 p-1 border border-white/15 rounded-full"
                    src={assets.logo_icon}
                    alt="Logo"
                  />
                  <div className="loader flex justify-center items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>
          )}
          <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />
          <p className="text-xs absolute bottom-1 text-gray-500">
            AI-generated, for reference only
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### Components

#### `components/Sidebar.jsx`

```jsx
import { assets } from "@/assets/assets";
import Image from "next/image";
import React, { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useAppContext } from "@/context/AppContext";
import ChatLabel from "./ChatLabel";

const Sidebar = ({ expand, setExpand }) => {
  const { user, chats, createNewChat } = useAppContext();
  const [openMenu, setOpenMenu] = useState({ id: 0, open: false });

  return (
    <div
      className={`flex flex-col justify-between bg-[#212327] pt-7 transition-all z-50 max-md:absolute max-md:h-screen ${expand ? "p-4 w-64" : "md:w-20 w-0 max-md:overflow-hidden"}`}
    >
      <div>
        <div
          className={`flex ${expand ? "flex-row gap-10" : "flex-col items-center gap-8"}`}
        >
          <Image
            className={expand ? "w-36" : "w-10"}
            src={expand ? assets.logo_text : assets.logo_icon}
            alt=""
          />
          <div
            onClick={() => setExpand(!expand)}
            className="group relative flex items-center justify-center hover:bg-gray-500/20 transition-all duration-300 h-9 w-9 aspect-square rounded-lg cursor-pointer"
          >
            <Image src={assets.menu_icon} alt="" className="md:hidden" />
            <Image
              src={expand ? assets.sidebar_close_icon : assets.sidebar_icon}
              alt=""
              className="hidden md:block w-7"
            />
          </div>
        </div>

        <button
          onClick={createNewChat}
          className={`mt-8 flex items-center justify-center cursor-pointer ${expand ? "bg-primary hover:opacity-90 rounded-2xl gap-2 p-2.5 w-max" : "group relative h-9 w-9 mx-auto hover:bg-gray-500/30 rounded-lg"}`}
        >
          <Image
            className={expand ? "w-6" : "w-7"}
            src={expand ? assets.chat_icon : assets.chat_icon_dull}
            alt=""
          />
          {expand && <p className="text-white text font-medium">New Chat</p>}
        </button>

        <div
          className={`mt-8 text-white/25 text-sm ${expand ? "block" : "hidden"}`}
        >
          <p className="my-1">Recents</p>
          {chats.map((chat) => (
            <ChatLabel
              key={chat._id}
              name={chat.name}
              id={chat._id}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
```

#### `components/Message.jsx`

```jsx
import { assets } from "@/assets/assets";
import Image from "next/image";
import React, { useEffect } from "react";
import Markdown from "react-markdown";
import Prism from "prismjs";

const Message = ({ role, content }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl text-sm">
      <div
        className={`flex flex-col w-full mb-8 ${role === "user" && "item-end"}`}
      >
        <div
          className={`group relative flex max-w-2xl py-3 rounded-xl ${role === "user" ? "bg-[#414158] px-5" : "gap-3"}`}
        >
          {role === "user" ? (
            <span className="text-white/90">{content}</span>
          ) : (
            <>
              <Image
                src={assets.logo_icon}
                alt=""
                className="h-9 w-9 p-1 border border-white/15 rounded-full"
              />
              <div className="space-y-4 w-full overflow-scroll">
                <Markdown>{content}</Markdown>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
```

#### `components/PromptBox.jsx`

```jsx
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import Image from "next/image";
import React, { useState, useRef } from "react";
import toast from "react-hot-toast";

const PromptBox = ({ setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState("");
  const { user, chats, setChats, selectedChat, setSelectedChat, getToken } =
    useAppContext();
  const timeoutRefs = useRef([]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      sendPrompt(e);
    }
  };

  const sendPrompt = async (e) => {
    const promptCopy = prompt;
    try {
      if (e?.preventDefault) e.preventDefault();
      if (!user) return toast.error("Login to send message");
      if (isLoading)
        return toast.error("Wait for the previous prompt response");

      let activeChat = selectedChat;
      if (!activeChat && chats.length > 0) {
        activeChat = chats[chats.length - 1];
        setSelectedChat(activeChat);
      }

      if (!activeChat) return toast.error("No chat selected");

      setIsLoading(true);
      setPrompt("");

      const userPrompt = {
        role: "user",
        content: prompt,
        timestamp: Date.now(),
      };

      // Update selectedChat state with user message
      const updatedSelectedChat = {
        ...selectedChat,
        messages: [...selectedChat.messages, userPrompt],
      };
      setSelectedChat(updatedSelectedChat);

      // Update chats state with user message
      const updatedChats = chats.map((chat) =>
        chat._id === activeChat._id
          ? { ...chat, messages: [...chat.messages, userPrompt] }
          : chat,
      );
      setChats(updatedChats);

      // Get authentication token from AppContext
      const token = await getToken();

      const { data } = await axios.post(
        "/api/Chat/AI",
        {
          chatId: activeChat._id,
          prompt,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!data.success) {
        throw new Error(data.message || "AI request failed");
      }

      // Get AI response
      const aiResponse = data.data || data;
      const aiContent = aiResponse.content || "";

      if (!aiContent) {
        throw new Error("No content in AI response");
      }

      // SIMPLIFIED VERSION - No streaming to avoid infinite loops
      const assistantMessage = {
        role: "assistant",
        content: aiContent,
        timestamp: Date.now(),
      };

      // Update selectedChat with AI response
      setSelectedChat((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Update chats array with AI response
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat._id === activeChat._id) {
            return {
              ...chat,
              messages: [...chat.messages, assistantMessage],
            };
          }
          return chat;
        }),
      );
    } catch (err) {
      console.error("Send prompt error:", err);
      if (err.response?.status === 401) {
        toast.error("Authentication failed. Please log in again.");
      } else {
        toast.error(err.message || "Something went wrong");
      }
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      rows={2}
      onSubmit={sendPrompt}
      className={`w-full ${
        selectedChat?.messages.length ? "max-w-3xl" : "max-w-2xl"
      } bg-[#404045] p-4 rounded-3xl mt-1 transition-all`}
    >
      <textarea
        onKeyDown={handleKeyDown}
        className="outline-none w-full resize-none overflow-hidden break-word bg-transparent"
        rows={1}
        placeholder="Message DeepSeek"
        required
        onChange={(e) => setPrompt(e.target.value)}
        value={prompt}
      />

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {/* Additional controls can be added here */}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className={`${
              prompt ? "bg-primary" : "bg-[#71717a]"
            } rounded-full p-2 cursor-pointer`}
          >
            <Image
              className="w-3.5 aspect-square"
              src={prompt ? assets.arrow_icon : assets.arrow_icon_dull}
              alt=""
            />
          </button>
        </div>
      </div>
    </form>
  );
};

export default PromptBox;
```

#### `components/ChatLabel.jsx`

```jsx
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import Image from "next/image";
import React from "react";
import toast from "react-hot-toast";

const ChatLabel = ({ name, id, openMenu, setOpenMenu }) => {
  const { fetchUserChats, chats, setSelectedChats } = useAppContext();

  const selectChat = () => {
    const chatData = chats.find((chat) => chat._id === id);
    setSelectedChats(chatData);
  };

  const renameHandler = async () => {
    try {
      const newName = prompt("Enter new name");
      if (!newName) return;
      const { data } = await axios.post("/api/Chat/Rename", {
        chatId: id,
        name: newName,
      });
      if (data.success) {
        fetchUserChats();
        setOpenMenu({ id: 0, open: false });
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteHandler = async () => {
    try {
      const confirm = window.confirm(
        "Are you sure you want to delete this chat",
      );
      if (!confirm) return;
      const { data } = await axios.post("/api/Chat/Delete", { chatId: id });
      if (data.success) {
        fetchUserChats();
        setOpenMenu({ id: 0, open: false });
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div
      onClick={selectChat}
      className="flex item-center justify-between p-2 text-white/80 hover:bg-gray-700 rounded-lg text-sm group cursor-pointer"
    >
      <p className="group-hover:max-5/6 truncate">{name}</p>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenu({ id: id, open: !openMenu.open });
        }}
        className="group relative flex items-center justify-center h-6 w-6 aspect-square hover:bg-black/80 rounded-lg"
      >
        <Image
          src={assets.three_dots}
          alt=""
          className={`w-4 ${openMenu.id === id && openMenu.open ? "" : "hidden"} group-hover:block`}
        />
        <div
          className={`absolute ${openMenu.id === id && openMenu.open ? "block" : "hidden"} -right-30 top-6 bg-gray-700 rounded-xl w-max p-2`}
        >
          <div
            onClick={renameHandler}
            className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg"
          >
            <Image src={assets.pencil_icon} alt="" className="w-4" />
            <p>Rename</p>
          </div>
          <div
            onClick={deleteHandler}
            className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg"
          >
            <Image src={assets.delete_icon} alt="" className="w-4" />
            <p>Delete</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLabel;
```

#### `assets/assets.js`

```javascript
import arrow_icon from "./arrow_icon.svg";
import arrow_icon_dull from "./arrow_icon_dull.svg";
import logo_text from "./logo_text.svg";
import logo_icon from "./logo_icon.svg";
import menu_icon from "./menu_icon.svg";
import search_icon from "./search_icon.svg";
import profile_icon from "./profile_icon.svg";
import copy_icon from "./copy_icon.svg";
import deepthink_icon from "./deepthink_icon.svg";
import chat_icon from "./chat_icon.svg";
import dislike_icon from "./dislike_icon.svg";
import like_icon from "./like_icon.svg";
import phone_icon from "./phone_icon.svg";
import phone_icon_dull from "./phone_icon_dull.svg";
import pencil_icon from "./pencil_icon.svg";
import delete_icon from "./delete_icon.svg";
import pin_icon from "./pin_icon.svg";
import regenerate_icon from "./regenerate_icon.svg";
import sidebar_icon from "./sidebar_icon.svg";
import sidebar_close_icon from "./sidebar_close_icon.svg";
import chat_icon_dull from "./chat_icon_dull.svg";
import qrcode from "./qrcode.png";
import three_dots from "./three_dots.svg";
import new_icon from "./new_icon.svg";

export const assets = {
  arrow_icon,
  arrow_icon_dull,
  logo_text,
  logo_icon,
  menu_icon,
  search_icon,
  profile_icon,
  copy_icon,
  deepthink_icon,
  chat_icon,
  dislike_icon,
  like_icon,
  phone_icon,
  phone_icon_dull,
  pencil_icon,
  delete_icon,
  pin_icon,
  regenerate_icon,
  sidebar_icon,
  sidebar_close_icon,
  chat_icon_dull,
  qrcode,
  three_dots,
  new_icon,
};
```

---

### API Routes

#### `api/Chat/AI/route.js` - AI Response Handler

```javascript
export const maxDuration = 60;
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req) {
  try {
    const { userId } = auth();
    const { chatId, prompt } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 },
      );
    }

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
```

#### `api/Chat/Create/route.js`

```javascript
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = auth();
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
```

#### `api/Chat/Get/route.js`

```javascript
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { currentUser } from "@clerk/nextjs/server";extjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 },
      );
    }

    await connectDB();
    const data = await Chat.find({ userId });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/Chat/Get error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
```

#### `api/Chat/Delete/route.js`

```javascript
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { currentUser } from "@clerk/nextjs/server";extjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = auth();
    const { chatId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 },
      );
    }

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
```

#### `api/Chat/Rename/route.js`

```javascript
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 },
      );
    }

    const { chatId, name } = await req.json();
    await connectDB();
    await Chat.findOneAndUpdate({ _id: chatId, userId }, { name });
    return NextResponse.json({ success: true, message: "Chat Renamed" });
  } catch (error) {
    console.error("POST /api/Chat/Rename error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
```

---

## Key Features

✅ **Real-time AI Chat** - Groq API integration with streaming responses  
✅ **Secure Authentication** - Clerk for user authentication and session management  
✅ **Chat Management** - Create, rename, and delete conversations  
✅ **Persistent Storage** - MongoDB stores all chats and messages  
✅ **Responsive Design** - Mobile and desktop optimized UI  
✅ **Rich Messaging** - Markdown rendering with code highlighting (Prism.js)  
✅ **Error Handling** - Toast notifications for user feedback  
✅ **Performance** - Optimized with React Compiler and efficient state management

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
