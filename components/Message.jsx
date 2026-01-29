import { assets } from "@/assets/assets";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import Prism from "prismjs";
import toast from "react-hot-toast";

const Message = ({ role, content }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  const handleCopy = async () => {
    try {
      // Fallback for clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement("textarea");
        textArea.value = content;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      setCopySuccess(true);
      toast.success("Copied to clipboard!");

      // Reset copy success after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

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
                {/* Add copy button for AI messages only */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <Image
                      src={assets.copy_icon}
                      alt="Copy"
                      className="w-4 h-4"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.target.style.display = "none";
                      }}
                    />
                    {copySuccess ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
