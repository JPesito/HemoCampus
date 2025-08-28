import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0B1E3A]/60 py-10 text-center text-xs text-white/60">
      <div className="mx-auto max-w-7xl px-5">
        <p>HemoCampus — Tipificación Sanguínea Interactiva ABO/Rh</p>
        <p className="mt-2">© {new Date().getFullYear()} • Recurso académico. No apto para uso clínico.</p>
      </div>
    </footer>
  );
}
