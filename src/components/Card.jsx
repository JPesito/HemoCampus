import React from "react";

export default function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur ${className}`}>
      {children}
    </div>
  );
}
