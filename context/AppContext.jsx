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
  // Remove getToken if you don't need it

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // Fixed: was selectedChats

  const createNewChat = async () => {
    try {
      if (!user) return null;
      // Remove token from headers - middleware handles auth
      await axios.post("/api/Chat/Create", {});
      fetchUserChats();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchUserChats = async () => {
    try {
      const { data } = await axios.get("/api/Chat/Get");
      if (data.success) {
        setChats(data.data);
        if (data.data.length === 0) {
          await createNewChat();
          return fetchUserChats();
        } else {
          data.data.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
          );
          setSelectedChat(data.data[0]);
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
    selectedChat, // Fixed: was selectedChats
    setSelectedChat, // Fixed: was setSelectedChats
    fetchUserChats,
    createNewChat,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
