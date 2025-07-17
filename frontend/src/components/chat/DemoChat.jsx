// components/DemoChat.js - Demo chat component
import React, { useState, useEffect } from "react";
import { MessageCircle, Lock, Eye } from "lucide-react";

const DemoChat = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    const loadDemoHistory = async () => {
      try {
        const response = await fetch("/api/demo/chat-history");
        const data = await response.json();
        setChatHistory(data.messages || []);
      } catch (error) {
        console.error("Failed to load demo chat:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDemoHistory();
  }, []);

  const handleDemoSubmit = (e) => {
    e.preventDefault();

    // Show demo message instead of actually sending
    alert(
      '🔒 Chat is disabled in demo mode\n\nThis is a public demonstration showcasing the interface and sample conversations. In the full version, you could ask questions like:\n\n• "What should I wear for a job interview?"\n• "Which items have the best cost per wear?"\n• "What gaps exist in my wardrobe?"\n• "Should I buy this new item?"'
    );

    setInputMessage("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Demo Mode Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">Demo Mode</span>
        </div>
        <p className="text-blue-700 mt-1">
          You're viewing a demonstration of the Wardrobe AI chat interface. The
          conversations below show sample interactions with real wardrobe data.
        </p>
      </div>

      {/* Chat History */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Sample Conversations
        </h2>

        <div className="space-y-4">
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-md p-3 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Chat Input */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-medium mb-3 flex items-center">
          <Lock className="h-4 w-4 mr-2 text-gray-400" />
          Try the Interface (Demo Mode)
        </h3>

        <form onSubmit={handleDemoSubmit} className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message to see demo mode response..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition-colors"
          >
            Send (Demo)
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-2">
          In demo mode, chat functionality is disabled. Click "Send" to see what
          would happen in the full version.
        </p>
      </div>
    </div>
  );
};

export default DemoChat;
