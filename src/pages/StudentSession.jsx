import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Peer from "peerjs";
import Nav from "../sections/Nav.jsx";
import Demo from "../sections/Demo.jsx";
import { getSession } from "../lib/sessionStore.js";
import { peerIdForSession } from "../lib/peerId.js"; 

export default function StudentSession() {
  const { sessionId } = useParams();

  const [sessionSnapshot, setSessionSnapshot] = useState(null);
  const [alias, setAlias] = useState("");
  const [ready, setReady] = useState(false);

  // PeerJS cliente (estudiante)
  const peerRef = useRef(null);
  const connRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Nota: si el estudiante está en otro dispositivo, no tiene acceso al localStorage del profe.
  // Por eso, la vista del alumno funciona incluso sin snapshot local: usa defaults razonables.
  useEffect(() => {
    const s = getSession(sessionId); // solo funciona si es mismo dispositivo (modo kiosco)
    if (s) setSessionSnapshot(s);
  }, [sessionId]);

  const maxRounds = sessionSnapshot?.exercisesPerStudent ?? 3;
  const maxAttemptsPerExercise = sessionSnapshot?.attemptsPerExercise ?? 3;
  const timePerAttemptSec = sessionSnapshot?.timePerAttemptSec ?? 90;

  const [roundsDone, setRoundsDone] = useState(0);
  const locked = ready && roundsDone >= maxRounds;

  function start() {
    if (!alias.trim()) return;

    // Estudiante abre su Peer (id aleatorio) y se conecta al id del profe (= sessionId)
    const peer = new Peer(); // usa PeerJS Cloud (free)
    peerRef.current = peer;

    peer.on("open", () => {
      const conn = peer.connect(peerIdForSession(sessionId), { reliable: true });
      connRef.current = conn;

      conn.on("open", () => {
        setConnected(true);
        // Enviar saludo opcional
        try { conn.send(JSON.stringify({ type: "join", alias })); } catch {}
      });

      conn.on("error", () => setConnected(false));
      conn.on("close", () => setConnected(false));
    });

    peer.on("error", () => setConnected(false));
    setReady(true);
  }

  function handleAttemptRecorded(entry) {
    // Envía intento al profesor si hay conexión P2P
    try {
      connRef.current?.send(JSON.stringify({ type: "attempt", alias, entry }));
    } catch {}
    setRoundsDone(r => Math.min(maxRounds, r + 1));
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gradient-to-br from-[#0B1E3A] via-[#123158] to-[#071C36] text-white">
        <section className="mx-auto max-w-5xl px-5 py-10">
          {!ready ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h1 className="text-2xl font-bold">Unirse a sesión</h1>
              <p className="mt-1 text-sm text-white/80">
                Sesión: <span className="font-semibold">{sessionSnapshot?.name || sessionId}</span>{sessionSnapshot?.subject ? ` • ${sessionSnapshot.subject}` : ""}
              </p>
              <ul className="mt-2 text-xs text-white/70">
                <li>Intentos por ejercicio: {maxAttemptsPerExercise}</li>
                <li>Tiempo por intento: {timePerAttemptSec} s</li>
                <li>Ejercicios a completar: {maxRounds}</li>
              </ul>
              <div className="mt-4">
                <label className="text-sm">Tu alias / nombre corto</label>
                <input value={alias} onChange={e=>setAlias(e.target.value)} placeholder="Estudiante_1"
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-white/30" />
              </div>
              <button onClick={start} className="mt-4 rounded-xl bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B21C2D]">
                Empezar
              </button>
              <p className="mt-2 text-xs text-white/60">
                Al empezar, te conectarás automáticamente con el profesor. Mantén esta pestaña abierta.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{sessionSnapshot?.name || `Sesión ${sessionId}`}</p>
                  <p className="text-white/70">{sessionSnapshot?.subject || "Evaluación ABO/Rh"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded bg-white/10 px-3 py-1">Estudiante: <b>{alias}</b></span>
                  <span className="rounded bg-white/10 px-3 py-1">Progreso: <b>{roundsDone} / {maxRounds}</b></span>
                  <span className={`rounded px-3 py-1 ${connected ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10"}`}>
                    {connected ? "Conectado" : "Conectando…"}
                  </span>
                </div>
              </div>

              <Demo
                modeOverride="evaluacion"
                evalSecondsOverride={timePerAttemptSec}
                maxAttemptsOverride={maxAttemptsPerExercise}
                interactionsEnabled={!locked}
                onAttemptRecorded={handleAttemptRecorded}
              />

              {locked && (
                <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  ¡Listo! Has completado los {maxRounds} ejercicios. Tu progreso se envió al profesor.
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
