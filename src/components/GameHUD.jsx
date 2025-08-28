import React from "react";

function Heart({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-6.716-4.297-9.428-7.01C-0.333 10.945 1.21 6.5 5.143 6.5c2.143 0 3.429 1.286 3.857 1.857.429-.571 1.714-1.857 3.857-1.857 3.933 0 5.476 4.445 2.571 7.49C18.716 16.703 12 21 12 21z"
        fill={filled ? "#ef4444" : "none"}
        stroke="#ef4444"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function GameHUD({ score, best, lives = 3, combo = 1, level = 1, timeLeft, timeMax }) {
  const pct = Math.max(0, Math.min(100, Math.round((timeLeft / timeMax) * 100)));
  const danger = pct < 15;
  const warning = pct >= 15 && pct < 40;

  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white ${danger ? "animate-[hud-shake_.5s_infinite]" : ""}`}>
      {/* keyframes locales */}
      <style>{`
        @keyframes bar-pulse { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.15)} }
        @keyframes hud-shake { 0%,100%{ transform:translateX(0) } 25%{ transform:translateX(-1px) } 75%{ transform:translateX(1px) } }
        @keyframes flame { 0%,100%{ transform:scale(1) translateY(0); opacity:.85 } 50%{ transform:scale(1.15) translateY(-2px); opacity:1 } }
      `}</style>

      <div className="flex items-center justify-between gap-3">
        {/* Vidas */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} filled={i < lives} />
          ))}
          <span className="ml-2 text-white/80">Vidas</span>
        </div>

        {/* Puntaje */}
        <div className="text-center">
          <div className="text-xs text-white/60">Puntaje</div>
          <div className="text-xl font-bold tabular-nums">{score}</div>
          <div className="text-[11px] text-white/50">Mejor: {best}</div>
        </div>

        {/* Nivel y combo */}
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-white/10 px-3 py-1 font-semibold">Nivel {level}</span>
          <span className={`relative rounded-lg px-3 py-1 font-semibold ${combo > 1 ? "bg-emerald-500 text-slate-900" : "bg-white/10 text-white/80"}`}>
            x{combo}
            {combo > 2 && (
              <span
                className="absolute -top-3 -right-2"
                style={{ animation: "flame 1.2s ease-in-out infinite" }}
                aria-hidden="true"
              >
                🔥
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Barra de tiempo */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full ${pct < 25 ? "bg-rose-500" : pct < 60 ? "bg-amber-400" : "bg-emerald-400"}`}
          style={{
            width: `${pct}%`,
            transition: "width .25s linear",
            animation: warning ? "bar-pulse .9s ease-in-out infinite" : "none",
          }}
        />
      </div>
      <div className="mt-1 text-right text-[11px] text-white/60">{timeLeft}s</div>
    </div>
  );
}
