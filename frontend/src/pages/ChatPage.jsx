// pages/ChatPage.js
import React from "react";
import DemoChat from "../components/chat/DemoChat";
import WardrobeAIChat from "../components/chat/WardrobeAIChat";

export const ChatPage = ({ demo }) => {
  return demo.isDemo ? <DemoChat /> : <WardrobeAIChat />;
};
