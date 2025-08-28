import React, { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";

/**
 * Props:
 * - open: boolean
 * - title: string
 * - children: ReactNode        // texto/extra bajo la animación
 * - onClose: () => void
 * - tone?: 'success' | 'error' // reproduce un jingle al abrir
 * - lottieAnim?: object        // JSON de Lottie importado
 */
export default function Modal({ open, title, children, onClose, tone, lottieAnim }) {
  const [render, setRender] = useState(false);
  const audioPlayedRef = useRef(false);
  const FADE_MS = 300; // duración de fade CSS

  // Mantén montado durante el fade de salida
  useEffect(() => {
    if (open) {
      setRender(true);
      audioPlayedRef.current = false; // permitir sonido
    } else {
      const t = setTimeout(() => setRender(false), FADE_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Sonidos “bonitos” con Web Audio (al abrir)
  useEffect(() => {
    if (!open || audioPlayedRef.current || !tone) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      const playNote = (freq, start, dur = 0.14, type = "sine", gainMax = 0.18) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(gainMax, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g).connect(ctx.destination);
        o.start(start);
        o.stop(start + dur + 0.02);
      };

      if (tone === "success") {
        // Arpegio mayor (C5–E5–G5) + golpe final C6 (alegre)
        const seq = [523.25, 659.25, 783.99, 1046.5];
        seq.forEach((f, i) => playNote(f, now + i * 0.12, i < 3 ? 0.12 : 0.18, i < 3 ? "triangle" : "sine", i < 3 ? 0.16 : 0.22));
      } else {
        // Descenso tenso (G4→E4→C4) con sawtooth leve
        const seq = [392.0, 329.63, 261.63];
        seq.forEach((f, i) => playNote(f, now + i * 0.12, 0.16, "sawtooth", 0.14));
      }

      audioPlayedRef.current = true;
    } catch {
      // Si el navegador bloquea audio autoplay, lo ignoramos (hay click de usuario, debería sonar).
    }
  }, [open, tone]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay con fade */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Panel con SÓLO fade (sin scale/translate) */}
      <div
        role="dialog" aria-modal="true"
        className={`relative w-[92vw] max-w-md rounded-2xl border border-white/10 bg-[#0B1E3A] p-6 text-white shadow-2xl transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex flex-col items-center text-center">
          {/* Lottie arriba si llega animación */}
          {lottieAnim && (
            <div className="mb-2 w-32 h-32">
              <Lottie animationData={lottieAnim} loop={false} autoplay={open} />
            </div>
          )}
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="mt-1 text-sm text-white/80">{children}</div>
          <div className="mt-4">
            <button
              onClick={onClose}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
