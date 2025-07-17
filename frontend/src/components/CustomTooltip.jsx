import React from "react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color }}>
            {pld.dataKey}: {pld.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
