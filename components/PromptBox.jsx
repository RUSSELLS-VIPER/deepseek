import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import Image from "next/image";
import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { getAuth } from "@clerk/nextjs/server";

const PromptBox = ({ setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState("");
  const { user, chats, setChats, selectedChat, setSelectedChat, getToken } =
    useAppContext(); // getToken is already in AppContext
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
    <form rows={2}
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
          {/* <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
            <Image className="h-5" src={assets.deepthink_icon} alt="" />
            DeepThink(R1)
          </p>
          <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
            <Image className="h-5" src={assets.search_icon} alt="" />
            Search
          </p> */}
        </div>

        <div className="flex items-center gap-2">
          {/* <Image className="w-4 cursor-pointer" src={assets.pin_icon} alt="" /> */}
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
