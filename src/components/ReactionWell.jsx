import React, { useEffect, useMemo, useRef, useState } from "react";

const DOTS = 28;

// PRNG determinista
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function genDots(seedInt) {
  const rand = mulberry32(seedInt);
  const arr = [];
  for (let i = 0; i < DOTS; i++) {
    const r = 0.25 + rand() * 0.55;
    const th = rand() * Math.PI * 2;
    const x = 50 + Math.cos(th) * r * 50;
    const y = 50 + Math.sin(th) * r * 50;
    const amp = 1.2 + rand() * 2.2;
    const ang = rand() * Math.PI * 2;
    const dur = 4 + Math.floor(rand() * 5);
    const delay = -Math.floor(rand() * 5);
    arr.push({ x, y, amp, ang, dur, delay });
  }
  return arr;
}

export default function ReactionWell({ label, added, agglutinates, seed = 0 }) {
  const [dots, setDots] = useState([]);
  const lastSeedRef = useRef(-1);

  // efectos de impacto
  const [pulse, setPulse] = useState(false);
  const prevAdded = useRef(added);
  const [dropId, setDropId] = useState(0); // re-dispara gota/splash
  const sparksMemo = useMemo(() => {
    // 10 chispas radiales
    return Array.from({ length: 10 }).map((_, i) => {
      const a = (i / 10) * Math.PI * 2;
      const r = 28 + Math.random() * 8; // px
      const d = 300 + Math.random() * 220; // ms
      return { a, r, d };
    });
  }, [dropId]);

  useEffect(() => {
    if (added && (dots.length === 0 || seed !== lastSeedRef.current)) {
      const baseSeed = Math.abs((((label?.length || 1) * 97 + seed * 101) | 0));
      setDots(genDots(baseSeed));
      lastSeedRef.current = seed;
    }
    // lanza ripple + gota cuando cambia added
    if (prevAdded.current !== added) {
      setPulse(false);
      requestAnimationFrame(() => setPulse(true));
      setTimeout(() => setPulse(false), 520);
      if (added) setDropId((v) => v + 1); // caer gota al añadir
      prevAdded.current = added;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [added, seed, label]);

  const Keyframes = useMemo(
    () => (
      <style>{`
        @keyframes hc-drift {
          from { transform: translate(-50%, -50%) translate(var(--dx0, 0px), var(--dy0, 0px)); }
          to   { transform: translate(-50%, -50%) translate(var(--dx1, 2px), var(--dy1, -2px)); }
        }
        @keyframes hc-ripple {
          0%   { transform: translate(-50%, -50%) scale(0.65); opacity: .45; }
          100% { transform: translate(-50%, -50%) scale(1.45); opacity: 0; }
        }
        @keyframes hc-drop {
          0%   { transform: translate(-50%, -180%) scale(1.05); opacity: .0; }
          70%  { transform: translate(-50%, -50%)  scale(1.0); opacity: 1; }
          100% { transform: translate(-50%, -50%)  scale(.0); opacity: 0; }
        }
        @keyframes hc-splash {
          0%   { transform: translate(-50%, -50%) scale(.35); opacity: .35; }
          80%  { opacity: .2; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes hc-spark {
          0%   { transform: translate(-50%, -50%) translate(0,0) scale(1); opacity: .0; }
          15%  { opacity: .9; }
          100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(.7); opacity: 0; }
        }
        @keyframes hc-glow {
          0%,100% { box-shadow: 0 0 0px rgba(244,63,94,.0), 0 0 0px rgba(244,63,94,.0); }
          50%     { box-shadow: 0 0 18px rgba(244,63,94,.45), 0 0 40px rgba(244,63,94,.18) inset; }
        }
      `}</style>
    ),
    []
  );

  const fadeStyle = { opacity: added ? 1 : 0, transition: "opacity .45s ease" };

  return (
    <div className="flex flex-col items-center gap-2">
      {Keyframes}
      <div
        className={`relative h-28 w-28 rounded-full border border-white/15 bg-white/5 p-1 shadow-inner ${agglutinates ? "animate-[hc-glow_1.6s_ease-in-out_infinite]" : ""}`}
      >
        <div className={`relative h-full w-full rounded-full transition-colors duration-300 ${added ? "bg-rose-200/20" : "bg-white/5"}`}>
          {/* brillo/splash/ripple */}
          {pulse && (
            <>
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border"
                style={{
                  width: "82%",
                  height: "82%",
                  borderColor: added ? "rgba(244,63,94,.55)" : "rgba(255,255,255,.35)",
                  animation: "hc-ripple .55s ease-out forwards",
                }}
              />
              {/* GOTa más gruesa y más oscura */}
              {added && (
                <span
                  key={dropId}
                  className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: 22,               // antes 14 -> más gruesa
                    height: 22,
                    background:
                      "radial-gradient(circle at 35% 35%, rgba(255,255,255,.85), rgba(153,27,27,1))", // rojo más oscuro (#991B1B)
                    boxShadow: "0 2px 8px rgba(0,0,0,.25), inset 0 0 4px rgba(0,0,0,.25)",
                    animation: "hc-drop .46s cubic-bezier(.2,.9,.2,1) forwards",
                    filter: "blur(.2px)",
                  }}
                />
              )}
              {/* splash ring un poco más marcado */}
              {added && (
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border"
                  style={{
                    width: 44,
                    height: 44,
                    borderColor: "rgba(153,27,27,.45)",
                    animation: "hc-splash .55s ease-out forwards",
                  }}
                />
              )}
              {/* chispas */}
              {added &&
                sparksMemo.map((s, i) => {
                  const tx = Math.cos(s.a) * s.r + "px";
                  const ty = Math.sin(s.a) * s.r + "px";
                  return (
                    <span
                      key={i}
                      className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                      style={{
                        width: 4,
                        height: 4,
                        background: "rgba(153,27,27,.95)", // oscuro
                        ["--tx"]: tx,
                        ["--ty"]: ty,
                        animation: `hc-spark ${s.d}ms ease-out forwards`,
                      }}
                    />
                  );
                })}
            </>
          )}

          {/* puntos */}
          <div className="absolute inset-0" style={fadeStyle}>
            {dots.map((d, i) => {
              const cluster = agglutinates ? 0.25 : 0;
              const left = d.x + (50 - d.x) * cluster;
              const top = d.y + (50 - d.y) * cluster;
              const tx1 = Math.cos(d.ang) * d.amp + "px";
              const ty1 = Math.sin(d.ang) * d.amp + "px";
              const size = agglutinates ? 7 : 4.5;
              return (
                <span
                  key={i}
                  className="absolute rounded-full will-change-transform"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: size,
                    height: size,
                    background: agglutinates ? "rgba(244,63,94,0.95)" : "rgba(255,255,255,0.7)",
                    transition: "left .6s ease, top .6s ease, width .35s ease, height .35s ease, background-color .35s ease",
                    ["--dx1"]: tx1,
                    ["--dy1"]: ty1,
                    animation: `hc-drift ${d.dur}s ease-in-out ${d.delay}s infinite alternate`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-sm text-white/80">{label}</p>
      <p className={`text-xs ${added ? (agglutinates ? "text-rose-300" : "text-emerald-300") : "text-white/40"}`}>
        {added ? (agglutinates ? "Aglutinación" : "Sin aglutinación") : "Añade reactivo"}
      </p>
    </div>
  );
}
