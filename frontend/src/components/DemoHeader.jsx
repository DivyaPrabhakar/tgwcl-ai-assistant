// components/DemoHeader.js
import React from "react";
import { Eye } from "lucide-react";

export const DemoHeader = ({ demo }) => (
  <div className="bg-blue-600 text-white p-3">
    <div className="max-w-6xl mx-auto text-center">
      <p className="font-medium flex items-center justify-center">
        <Eye className="h-4 w-4 mr-2" />
        🌟 Wardrobe AI Demo - {demo.user.name}
      </p>
      <p className="text-blue-100 text-sm mt-1">{demo.message}</p>
    </div>
  </div>
);
