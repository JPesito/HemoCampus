import React, { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import Peer from "peerjs";
import { createSession, listSessions, getSessionStats, addAttemptToSession } from "../lib/sessionStore.js";
import Nav from "../sections/Nav.jsx";
import { peerIdForSession } from "../lib/peerId.js";

export default function TeacherCreateSession() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [attemptsPerExercise, setAttemptsPerExercise] = useState(3);
  const [timePerAttemptSec, setTimePerAttemptSec] = useState(90);
  const [exercisesPerStudent, setExercisesPerStudent] = useState(3);

  const [created, setCreated] = useState(null);
  const [refresh, setRefresh] = useState(0);

  // PeerJS host (profesor)
  const peerRef = useRef(null);
  const [peerStatus, setPeerStatus] = useState("idle"); // idle | ready | error
  const [connectedPeers, setConnectedPeers] = useState([]); // lista de peerIds conectados

  const sessions = useMemo(() => listSessions(), [refresh]);

  function handleCreate(e) {
    e.preventDefault();
    const s = createSession({ name, subject, attemptsPerExercise, timePerAttemptSec, exercisesPerStudent });
    setCreated(s);
    setName(""); setSubject("");
    setAttemptsPerExercise(3); setTimePerAttemptSec(90); setExercisesPerStudent(3);
    setRefresh(v => v + 1);
  }

  // Arranca el host cuando hay sesión creada
  useEffect(() => {
    if (!created) return;

    // Cerrar host anterior si existía
    try { peerRef.current?.destroy(); } catch {}

    const peer = new Peer(peerIdForSession(created.id));
    peerRef.current = peer;
    setPeerStatus("idle");
    setConnectedPeers([]);

    peer.on("open", () => setPeerStatus("ready"));
    peer.on("error", (err) => {
      console.error("Peer error:", err);
      setPeerStatus("error");
    });

    // Cuando un estudiante se conecta
    peer.on("connection", (conn) => {
      setConnectedPeers((prev) => [...new Set([...prev, conn.peer])]);

      conn.on("data", (raw) => {
        try {
          const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (msg?.type === "attempt" && msg.entry && msg.alias) {
            addAttemptToSession(created.id, msg.alias, msg.entry);
            setRefresh(v => v + 1);
          }
        } catch (e) { /* ignore */ }
      });

      conn.on("close", () => {
        setConnectedPeers((prev) => prev.filter((p) => p !== conn.peer));
      });
    });

    return () => {
      try { peer.destroy(); } catch {}
    };
  }, [created]);

  const shareUrl = created ? `${window.location.origin}/sesion/${created.id}` : "";

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gradient-to-br from-[#0B1E3A] via-[#123158] to-[#071C36] text-white">
        <section className="mx-auto max-w-5xl px-5 py-10">
          <h1 className="text-3xl font-bold">Panel Docente</h1>
          <p className="mt-2 text-white/70 text-sm">
            Crea una sesión y comparte el enlace/QR. Los estudiantes se conectan automáticamente (P2P con PeerJS gratuito).
          </p>

          {/* Crear sesión */}
          <form onSubmit={handleCreate} className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="text-sm">Nombre de la sesión
                <input value={name} onChange={e=>setName(e.target.value)} required
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="Grupo 301 • Práctica ABO/Rh" />
              </label>
              <label className="text-sm">Materia / Curso
                <input value={subject} onChange={e=>setSubject(e.target.value)} required
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="Hematología I" />
              </label>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <label className="text-sm">Intentos por ejercicio
                <input type="number" min={1} max={5} value={attemptsPerExercise} onChange={e=>setAttemptsPerExercise(parseInt(e.target.value||"0"))}
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-white/30" />
              </label>
              <label className="text-sm">Tiempo por intento (seg)
                <input type="number" min={15} max={300} value={timePerAttemptSec} onChange={e=>setTimePerAttemptSec(parseInt(e.target.value||"0"))}
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-white/30" />
              </label>
              <label className="text-sm">Ejercicios por estudiante
                <input type="number" min={1} max={20} value={exercisesPerStudent} onChange={e=>setExercisesPerStudent(parseInt(e.target.value||"0"))}
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-white/30" />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" className="rounded-xl bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B21C2D]">
                Crear sesión
              </button>
            </div>
          </form>

          {/* Enlace/QR y estado del host */}
          {created && (
            <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-semibold">Sesión creada</h2>
                <p className="mt-1 text-sm text-white/70">
                  <span className="font-medium">Nombre:</span> {created.name}<br/>
                  <span className="font-medium">Materia:</span> {created.subject}<br/>
                  <span className="font-medium">Parámetros:</span> {created.attemptsPerExercise} intentos • {created.timePerAttemptSec}s • {created.exercisesPerStudent} ejercicios
                </p>
                <div className="mt-3">
                  <p className="text-sm text-white/80">Enlace para estudiantes:</p>
                  <a href={shareUrl} className="mt-1 inline-block break-all rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/20">{shareUrl}</a>
                </div>
                <p className="mt-3 text-xs">
                  Estado de conexión:{" "}
                  {peerStatus === "ready" ? <span className="text-emerald-300">Listo para recibir conexiones</span> :
                   peerStatus === "error" ? <span className="text-rose-300">Error de señalización</span> :
                   "Inicializando…"}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Mantén esta página abierta; si la cierras, se corta la sincronización.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="rounded-2xl bg-white p-4">
                  <QRCode value={shareUrl} size={160} />
                </div>
                <div className="text-xs text-white/70">
                  Conectados: {connectedPeers.length}
                </div>
              </div>
            </div>
          )}

          {/* Tabla de sesiones y estadísticas */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold">Sesiones recientes</h2>
            {!sessions.length ? (
              <p className="mt-2 text-sm text-white/70">Aún no hay sesiones.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-white/70">
                    <tr>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">ID</th>
                      <th className="py-2 px-3">Sesión</th>
                      <th className="py-2 px-3">Materia</th>
                      <th className="py-2 px-3">Parámetros</th>
                      <th className="py-2 px-3">Intentos</th>
                      <th className="py-2 px-3">Acierto</th>
                      <th className="py-2 px-3">Score prom.</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sessions.map(s => {
                      const stats = getSessionStats(s.id);
                      return (
                        <tr key={s.id}>
                          <td className="py-2 px-3">{new Date(s.createdAt).toLocaleString()}</td>
                          <td className="py-2 px-3">{s.id}</td>
                          <td className="py-2 px-3">{s.name}</td>
                          <td className="py-2 px-3">{s.subject}</td>
                          <td className="py-2 px-3">{s.attemptsPerExercise} it • {s.timePerAttemptSec}s • {s.exercisesPerStudent} ej</td>
                          <td className="py-2 px-3">{stats?.total ?? 0}</td>
                          <td className="py-2 px-3">{stats ? `${stats.accuracy}%` : "-"}</td>
                          <td className="py-2 px-3">{stats ? stats.avgScore : "-"}</td>
                          <td className="py-2 px-3">
                            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href={`${window.location.origin}/sesion/${s.id}`}>
                              Abrir enlace
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
