'use client'
import { assets } from "@/assets/assets";
import Message from "@/components/Message";
import PromptBox from "@/components/PromptBox";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { useState } from "react";

export default function Home() {

  const [expand, setExpand] = useState(false)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="h-screen bg-[#292a2d] text-white">
      <div className="flex h-full">
        <Sidebar expand={expand} setExpand={setExpand} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 relative">

          {/* Mobile Header */}
          <div className="md:hidden absolute top-6 left-0 px-4 flex items-center justify-between w-full">
            <Image
              onClick={() => setExpand(!expand)}
              className="rotate-180 cursor-pointer"
              src={assets.menu_icon}
              alt=""
            />
            <Image
              className="opacity-70"
              src={assets.chat_icon}
              alt=""
            />
          </div>

          {/* Empty Chat UI */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3">
                <Image
                  src={assets.logo_icon}
                  alt=""
                  className="h-16 w-auto"
                />
                <p className="text-2xl font-medium">
                  Hi, I'm DeepSeek
                </p>
              </div>
              <p className="text-sm mt-2 opacity-80">
                How can I help you today?
              </p>
            </div>
          ) : (
              <div>
                <Message role='user' content='What is next js'/>
            </div>
          )
          }
          <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />
          <p className="text-xs absolute bottom-1 text-gray-500">
            AI-generated, for reference only
          </p>

        </div>
      </div>
    </div>
  );
}
