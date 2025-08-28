import React from "react";

export default function SectionTitle({ kicker, title, subtitle }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {kicker && <p className="mb-2 text-sm font-semibold tracking-widest text-rose-300/90">{kicker}</p>}
      <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-base text-white/70">{subtitle}</p>}
    </div>
  );
}
