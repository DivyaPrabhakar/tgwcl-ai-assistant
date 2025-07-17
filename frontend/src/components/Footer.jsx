// components/Footer.js
import React from "react";
import { Eye } from "lucide-react";

export const Footer = ({ demo }) => (
  <footer className="bg-white border-t mt-12">
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Wardrobe AI</h3>
          <p className="text-sm text-gray-600">
            {demo.isDemo
              ? "A demonstration of AI-powered wardrobe analytics using real data."
              : "Your personal AI-powered wardrobe analytics assistant."}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Real-time wardrobe analytics</li>
            <li>• Cost-per-wear analysis</li>
            <li>• Usage pattern insights</li>
            <li>• Multi-database integration</li>
            {!demo.isDemo && <li>• AI-powered recommendations</li>}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Technology</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• React + Node.js</li>
            <li>• Airtable integration</li>
            <li>• OpenAI GPT-4</li>
            <li>• Real-time analytics</li>
            <li>• Secure API design</li>
          </ul>
        </div>
      </div>

      <div className="border-t mt-8 pt-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Built with ❤️ using React, Node.js, Airtable & OpenAI
        </p>

        {demo.isDemo && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <Eye className="h-4 w-4" />
            <span>Demo Mode - Chat functionality disabled</span>
          </div>
        )}
      </div>
    </div>
  </footer>
);
