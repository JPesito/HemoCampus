import React from "react";
import { useLocation } from "react-router-dom";

export default function Nav() {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1E3A]/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <a href="/" className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded bg-[#D7263D]" />
          <span className="text-sm font-bold tracking-wide">HemoCampus</span>
        </a>

        {onHome ? (
          <nav className="hidden gap-6 text-sm md:flex">
            <a href="#como-funciona" className="text-white/80 hover:text-white">Cómo funciona</a>
            <a href="#simulacion"   className="text-white/80 hover:text-white">Simulación</a>
            <a href="#resultados"   className="text-white/80 hover:text-white">Resultados</a>
            <a href="#faq"          className="text-white/80 hover:text-white">FAQ</a>
          </nav>
        ) : (
          <div className="text-sm text-white/70">Panel</div>
        )}

        <div className="flex items-center gap-2">
          <a href="/docente" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            Docente
          </a>
          <a href={onHome ? "#simulacion" : "/#simulacion"} className="rounded-xl bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#B21C2D]">
            Iniciar práctica
          </a>
        </div>
      </div>
    </header>
  );
}
