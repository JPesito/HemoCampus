import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import ReactionWell from "../components/ReactionWell.jsx";
import Modal from "../components/Modal.jsx";
import GameHUD from "../components/GameHUD.jsx";
import { makeRandomSample, sampleToABO, sampleToLabel } from "../lib/sample.js";
import { playToggle, playStart, playScore, playComboUp, playLoseLife, playGameOver } from "../lib/sfx.js";

const START_LIVES = 3;
const BASE_TIME = 30;
const TIME_FLOOR = 12;
const LEVEL_UP_EVERY = 5;

// Fondo animado y confeti pequeño
function ArcadeFX() {
  return (
    <>
      <style>{`
        @keyframes bg-pan {
          0% { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
        @keyframes cell-drift {
          0% { transform: translateY(0) translateX(0) scale(1); opacity:.15 }
          50% { transform: translateY(-18px) translateX(6px) scale(1.05); opacity:.28 }
          100% { transform: translateY(0) translateX(0) scale(1); opacity:.15 }
        }
        @keyframes confetti {
          0% { transform: translateY(-20px) rotate(0deg); opacity:0 }
          15% { opacity:1 }
          100% { transform: translateY(220px) rotate(360deg); opacity:0 }
        }
      `}</style>
      {/* gradiente en movimiento */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[.10]"
          style={{
            background:
              "linear-gradient(90deg, #D7263D 0%, #7C3AED 25%, #06B6D4 50%, #22C55E 75%, #D7263D 100%)",
            backgroundSize: "200% 100%",
            animation: "bg-pan 18s linear infinite",
          }}
        />
        {/* células flotantes */}
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full mix-blend-screen"
            style={{
              left: `${8 + i * 9}%`,
              top: `${20 + (i % 5) * 12}%`,
              width: 60 + (i % 3) * 18,
              height: 60 + (i % 3) * 18,
              background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,.35), rgba(255,255,255,0))",
              filter: "blur(6px)",
              animation: `cell-drift ${8 + (i % 5)}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function ConfettiBurst({ show }) {
  if (!show) return null;
  const pieces = Array.from({ length: 60 }).map((_, i) => {
    const x = 10 + Math.random() * 80; // %
    const delay = Math.random() * 0.15;
    const dur = 1.2 + Math.random() * 0.6;
    const size = 4 + Math.random() * 6;
    const color = ["#22c55e", "#06b6d4", "#f59e0b", "#ef4444", "#a855f7"][i % 5];
    return { i, x, delay, dur, size, color };
  });
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-16 z-20">
      {pieces.map(p => (
        <span
          key={p.i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.size,
            background: p.color,
            transformOrigin: "center",
            animation: `confetti ${p.dur}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default function Arcade() {
  const [started, setStarted] = useState(false);
  const [lives, setLives] = useState(START_LIVES);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(1);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("hc_best_score") || 0));
  const [timeMax, setTimeMax] = useState(BASE_TIME);
  const [timeLeft, setTimeLeft] = useState(BASE_TIME);

  const [sample, setSample] = useState(() => makeRandomSample());
  const [added, setAdded] = useState({ A: false, B: false, D: false });
  const [guessABO, setGuessABO] = useState("O");
  const [guessRh, setGuessRh] = useState(true);
  const [wellSeed, setWellSeed] = useState(0);

  const correct = useMemo(
    () => sampleToABO(sample) === guessABO && sample.Rh === guessRh,
    [sample, guessABO, guessRh]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState(null);
  const [modalTone, setModalTone] = useState(undefined);
  const closeT = useRef(null);

  const [confetti, setConfetti] = useState(false);
  const [scoreFx, setScoreFx] = useState(null); // {amount, id}

  function openModal({ title, body, tone, autoMs = 1500 }) {
    setModalTitle(title);
    setModalBody(body);
    setModalTone(tone);
    setModalOpen(true);
    clearTimeout(closeT.current);
    closeT.current = setTimeout(() => setModalOpen(false), autoMs);
  }
  useEffect(() => () => clearTimeout(closeT.current), []);

  // Timer loop
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          onTimeOut();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started]);

  function newRound(nextLevel = level) {
    const nextTime = Math.max(TIME_FLOOR, BASE_TIME - (nextLevel - 1) * 2);
    setTimeMax(nextTime);
    setTimeLeft(nextTime);
    setSample(makeRandomSample());
    setAdded({ A: false, B: false, D: false });
    setWellSeed((s) => s + 1);
  }

  function startGame() {
    setLives(START_LIVES);
    setLevel(1);
    setCombo(1);
    setScore(0);
    newRound(1);
    setStarted(true);
    try { playStart(); } catch {}
  }

  function endGame() {
    setStarted(false);
    setCombo(1);
    setTimeLeft(0);
    const newBest = Math.max(best, score);
    setBest(newBest);
    localStorage.setItem("hc_best_score", String(newBest));
    openModal({
      title: "Game Over",
      body: (
        <div className="space-y-1">
          <p className="text-white/80 text-sm">Puntaje: <span className="font-semibold">{score}</span></p>
          <p className="text-white/80 text-sm">Mejor: <span className="font-semibold">{newBest}</span></p>
        </div>
      ),
      tone: "error",
      autoMs: 2000,
    });
    try { playGameOver(); } catch {}
  }

  function onTimeOut() {
    setLives((lv) => {
      const left = lv - 1;
      try { playLoseLife(); } catch {}
      openModal({
        title: "¡Tiempo agotado!",
        body: <p className="text-rose-300 text-sm">Pierdes una vida.</p>,
        tone: "error",
        autoMs: 1000,
      });
      if (left <= 0) {
        setTimeout(endGame, 600);
      } else {
        newRound(level);
      }
      return Math.max(0, left);
    });
    setCombo(1);
  }

  function reagentToggle(key) {
    setAdded((v) => {
      const next = !v[key];
      try { playToggle(next); } catch {}
      if (navigator.vibrate) navigator.vibrate(next ? [10, 20] : 10);
      return { ...v, [key]: next };
    });
  }

  function pointsFor(isCorrect, usedTime, timeMaxLocal, usedReagents) {
    if (!isCorrect) return 0;
    const base = 100;
    const timeBonus = Math.round((timeMaxLocal - usedTime) / timeMaxLocal * 60);
    const efficiencyBonus = usedReagents <= 2 ? 20 : 0;
    return base + timeBonus + efficiencyBonus;
  }

  function levelDifficultyUp(prevLevel, justHit) {
    const key = "hc_hits_arcade";
    const hits = Number(localStorage.getItem(key) || 0) + (justHit ? 1 : 0);
    localStorage.setItem(key, String(hits));
    const need = LEVEL_UP_EVERY * prevLevel;
    if (hits >= need) {
      localStorage.setItem(key, "0");
      const newLv = prevLevel + 1;
      // confeti/celebración
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1500);
      setLevel(newLv);
      setTimeout(() => newRound(newLv), 250);
    } else {
      setTimeout(() => newRound(prevLevel), 250);
    }
  }

  function handleCheck() {
    if (!started) return;
    const isCorrect = correct;
    const used = ["A","B","D"].filter(k => added[k]).length;
    const usedTime = timeMax - timeLeft;

    if (isCorrect) {
      const gained = pointsFor(true, usedTime, timeMax, used);
      const nextCombo = Math.min(9, combo + 1);
      const total = Math.round(gained * (1 + (nextCombo - 1) * 0.25));
      setScore((s) => s + total);
      setScoreFx({ amount: `+${total}`, id: Date.now() });
      setTimeout(() => setScoreFx(null), 900);

      setCombo(nextCombo);
      openModal({
        title: "¡Correcto!",
        body: <p className="text-emerald-300 text-sm">+{total} puntos {nextCombo > 1 ? `(x${nextCombo})` : ""}</p>,
        tone: "success",
        autoMs: 900,
      });
      try { playScore(); if (nextCombo > 2) playComboUp(); } catch {}
      levelDifficultyUp(level, true);
    } else {
      setCombo(1);
      setLives((lv) => {
        const left = lv - 1;
        openModal({
          title: "Incorrecto",
          body: <p className="text-rose-300 text-sm">Respuesta: {sampleToLabel(sample)}</p>,
          tone: "error",
          autoMs: 1000,
        });
        try { playLoseLife(); } catch {}
        if (left <= 0) {
          setTimeout(endGame, 600);
        } else {
          levelDifficultyUp(level, false); // no sube, resetea ronda
        }
        return Math.max(0, left);
      });
    }
  }

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-16 text-white overflow-hidden">
      <ArcadeFX />
      <SectionTitle
        kicker="Modo Arcade"
        title="Tipificación gamificada"
        subtitle="Gana puntos, mantén la racha y sube de nivel. ¡Evita quedarte sin tiempo!"
      />

      {!started ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2 flex flex-col items-center justify-center py-10">
            <p className="text-white/80 mb-4">3 vidas • temporizador por ronda • combo por aciertos seguidos</p>
            <button
              onClick={startGame}
              className="rounded-2xl bg-emerald-500 px-6 py-3 text-slate-900 font-semibold hover:bg-emerald-400 transition"
            >
              Empezar
            </button>
          </Card>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <GameHUD
                score={score}
                best={best}
                lives={lives}
                combo={combo}
                level={level}
                timeLeft={timeLeft}
                timeMax={timeMax}
              />
              <Card className="mt-4">
                <h3 className="text-lg font-semibold">Tu hipótesis</h3>
                <p className="mt-1 text-sm text-white/70">Selecciona el grupo ABO y el factor Rh.</p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                  {["O","A","B","AB"].map(t => (
                    <button
                      key={t}
                      onClick={() => setGuessABO(t)}
                      className={`rounded-xl px-3 py-2 font-semibold ${guessABO===t?"bg-[#D7263D] text-white":"bg-white/10 text-white/90 hover:bg-white/20"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2 text-sm">
                  <button
                    onClick={() => setGuessRh(true)}
                    className={`rounded-xl px-3 py-2 font-semibold ${guessRh?"bg-[#D7263D] text-white":"bg-white/10 text-white/90 hover:bg-white/20"}`}
                  >
                    Rh +
                  </button>
                  <button
                    onClick={() => setGuessRh(false)}
                    className={`rounded-xl px-3 py-2 font-semibold ${!guessRh?"bg-[#D7263D] text-white":"bg-white/10 text-white/90 hover:bg-white/20"}`}
                  >
                    Rh −
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleCheck}
                    className="relative rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 transition"
                  >
                    Comprobar
                    {/* puntos flotantes al anotar */}
                    {scoreFx && (
                      <span
                        key={scoreFx.id}
                        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 select-none"
                        style={{
                          animation: "float-up .9s ease-out forwards",
                          textShadow: "0 2px 8px rgba(0,0,0,.35)",
                        }}
                      >
                        +{String(scoreFx.amount).replace('+','')}
                      </span>
                    )}
                  </button>
                  <style>{`
                    @keyframes float-up {
                      0% { transform: translate(-50%, -10%) scale(.9); opacity: .0 }
                      20%{ opacity: 1 }
                      100% { transform: translate(-50%, -160%) scale(1.2); opacity: 0 }
                    }
                  `}</style>
                  <button
                    onClick={() => setAdded({ A:false, B:false, D:false })}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                  >
                    Limpiar pozos
                  </button>
                </div>
              </Card>
            </div>

            {/* Pozos */}
            <Card className="lg:col-span-2">
              <h3 className="text-lg font-semibold">Pozos de reacción</h3>
              <p className="mt-1 text-sm text-white/70">Añade un reactivo y observa la aglutinación.</p>

              <div className="mt-6 grid grid-cols-3 gap-6">
                <ReactionWell label="anti-A" added={added.A} agglutinates={added.A && sample.A} seed={wellSeed} />
                <ReactionWell label="anti-B" added={added.B} agglutinates={added.B && sample.B} seed={wellSeed} />
                <ReactionWell label="anti-D (Rh)" added={added.D} agglutinates={added.D && sample.Rh} seed={wellSeed} />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  onClick={() => reagentToggle("A")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${added.A ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-white/90 hover:bg-white/20"}`}
                >
                  {added.A ? "Quitar anti-A" : "Añadir anti-A"}
                </button>
                <button
                  onClick={() => reagentToggle("B")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${added.B ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-white/90 hover:bg-white/20"}`}
                >
                  {added.B ? "Quitar anti-B" : "Añadir anti-B"}
                </button>
                <button
                  onClick={() => reagentToggle("D")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${added.D ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-white/90 hover:bg-white/20"}`}
                >
                  {added.D ? "Quitar anti-D" : "Añadir anti-D"}
                </button>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* confeti en level up */}
      <ConfettiBurst show={confetti} />

      {/* Modal de feedback & game over */}
      <Modal
        open={modalOpen}
        title={modalTitle}
        tone={modalTone}
        onClose={() => setModalOpen(false)}
      >
        {modalBody}
      </Modal>
    </section>
  );
}
