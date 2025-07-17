// src/components/WardrobeAIChat.js
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  X,
} from "lucide-react";

const WardrobeAIChat = ({ isModal = false, onClose = null }) => {
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      content:
        "Hi! I'm your personal wardrobe AI assistant. I have access to your complete wardrobe data including your active items, usage patterns, cost analysis, shopping list, and style inspiration. What would you like to know about your closet today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Replace with your deployed backend URL or keep localhost for local development
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if backend is connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Backend connection failed:", error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, [API_BASE_URL]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: messages.slice(-5), // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage = {
        type: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        type: "assistant",
        content:
          "I'm having trouble connecting to your wardrobe data right now. Please make sure your backend server is running and try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "What are my most worn items?",
      category: "Usage Patterns",
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      text: "What's my best cost per wear?",
      category: "Cost Analysis",
    },
    {
      icon: <ShoppingBag className="w-4 h-4" />,
      text: "What's on my shopping list?",
      category: "Shopping",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      text: "What occasions do I need more clothes for?",
      category: "Gaps",
    },
  ];

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div
      className={`flex flex-col bg-white ${
        isModal ? "h-full" : "h-screen max-w-4xl mx-auto"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Wardrobe AI Assistant
            </h1>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {isConnected
                  ? "Connected to your wardrobe data"
                  : "Connecting..."}
              </span>
            </div>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex space-x-3 ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.type === "assistant" && (
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === "user"
                  ? "bg-blue-500 text-white"
                  : message.isError
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.type === "user" && (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex space-x-3 justify-start">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">
                  Analyzing your wardrobe data...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (show only if few messages) */}
      {messages.length <= 2 && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Try asking about:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(suggestion.text)}
                className="flex items-center space-x-2 p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                disabled={isLoading}
              >
                <div className="text-purple-500">{suggestion.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {suggestion.text}
                  </p>
                  <p className="text-xs text-gray-500">{suggestion.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your wardrobe patterns, cost analysis, shopping needs..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={1}
            disabled={isLoading || !isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim() || !isConnected}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {!isConnected && (
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Unable to connect to wardrobe data. Make sure your backend server
            is running.
          </p>
        )}

        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default WardrobeAIChat;
