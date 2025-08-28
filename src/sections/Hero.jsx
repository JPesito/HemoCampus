import React from "react";
import Chip from "../components/Chip.jsx";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-20 md:pt-28">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="absolute -right-24 -top-16 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <Chip>Simulación de laboratorio • ABO/Rh</Chip>
          <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
            Tipificación sanguínea interactiva para el aula
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/75 md:text-lg">
            Practica la determinación del grupo sanguíneo <span className="font-semibold">ABO y Rh</span> con pasos guiados, feedback inmediato y fundamentos científicos claros.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a href="#simulacion" className="rounded-xl bg-[#D7263D] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#B21C2D]">Iniciar práctica</a>
            <a href="#como-funciona" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10">Ver cómo funciona</a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-white/60">
            <span>Tipificación directa (forward typing)</span>
            <span>•</span>
            <span>anti-A, anti-B y anti-D</span>
            <span>•</span>
            <span>Enfoque didáctico y seguro</span>
          </div>
        </div>
      </div>
    </section>
  );
}
