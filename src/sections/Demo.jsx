import React, { useMemo, useState, useEffect } from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import Card from "../components/Card.jsx";
import ReactionWell from "../components/ReactionWell.jsx";
import Modal from "../components/Modal.jsx";
import { makeRandomSample, sampleToABO } from "../lib/sample.js";

// Lottie (opcional si tu Modal lo soporta)
import successAnim from "../assets/lottie/success.json";
import errorAnim from "../assets/lottie/error.json";

// Sonidos
import { playToggle } from "../lib/sfx.js";

/**
 * Props:
 * - modeOverride: 'aprendizaje' | 'evaluacion' | 'libre'
 * - uiVariant: 'full' | 'free'
 * - evalSecondsOverride?: number
 * - maxAttemptsOverride?: number
 * - interactionsEnabled?: boolean
 * - onAttemptRecorded?: (entry) => void
 * - enableCombinedAB?: boolean
 */
export default function Demo({
  modeOverride,
  uiVariant = "full",
  evalSecondsOverride,
  maxAttemptsOverride,
  interactionsEnabled = true,
  onAttemptRecorded,
  enableCombinedAB = true,
}) {
  const [mode, setMode] = useState(modeOverride || "aprendizaje");
  const [sample, setSample] = useState(() => makeRandomSample());
  const [added, setAdded] = useState({ A: false, B: false, D: false, AB: false });
  const [guessABO, setGuessABO] = useState("O");
  const [guessRh, setGuessRh] = useState(true);
  const [checked, setChecked] = useState(null);
  const [wellSeed, setWellSeed] = useState(0);

  const DEFAULT_SECONDS = typeof evalSecondsOverride === "number" ? evalSecondsOverride : 90;
  const DEFAULT_MAX_ATT = Number.isFinite(maxAttemptsOverride) ? maxAttemptsOverride : 3;

  const [timeLeft, setTimeLeft] = useState(DEFAULT_SECONDS);
  const [attemptCount, setAttemptCount] = useState(0);

  const results = useMemo(
    () => ({
      antiA: added.A && sample.A,
      antiB: added.B && sample.B,
      antiD: added.D && sample.Rh,
      antiAB: added.AB && (sample.A || sample.B),
    }),
    [added, sample]
  );

  const correct = useMemo(
    () => sampleToABO(sample) === guessABO && sample.Rh === guessRh,
    [sample, guessABO, guessRh]
  );

  const MAX_ATTEMPTS = DEFAULT_MAX_ATT;
  const EVAL_SECONDS = DEFAULT_SECONDS;

  useEffect(() => {
    if (modeOverride) setMode(modeOverride);
  }, [modeOverride]);

  // Temporizador en evaluación (sin autocierre del modal)
  useEffect(() => {
    if (mode !== "evaluacion" || checked !== null) return;
    setTimeLeft(EVAL_SECONDS);
  }, [mode, EVAL_SECONDS, checked]);

  useEffect(() => {
    if (mode !== "evaluacion" || checked !== null) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          handleCheck(true); // timeout cuenta como incorrecto
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, checked, EVAL_SECONDS]);

  function computeScore(isCorrect, addedMap, timeLeftSec) {
    let score = isCorrect ? 100 : 0;
    const used = ["A", "B", "D", "AB"].filter((k) => addedMap[k]).length;
    if (used > 3) score -= (used - 3) * 5;
    if (mode === "evaluacion") {
      const usedTime = EVAL_SECONDS - timeLeftSec;
      const timePenalty = Math.round((usedTime / EVAL_SECONDS) * 20);
      score -= timePenalty;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ---------- Modal sin cierre automático ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState(null);
  const [modalTone, setModalTone] = useState(undefined);
  const [modalAnim, setModalAnim] = useState(null);

  // Explicación con negritas/cursivas (sin revelar la respuesta literal)
  function explanationFragment() {
    const items = [];
    items.push(
      <p key="p1" className="text-white/80 text-sm">
        <strong>Paso 1.</strong> Observa la presencia de <em>aglutinación</em> en cada pozo:
        {" "}
        <strong>anti-A</strong> {sample.A ? <><em>(+)</em></> : <><em>(−)</em></>} ·{" "}
        <strong>anti-B</strong> {sample.B ? <><em>(+)</em></> : <><em>(−)</em></>} ·{" "}
        <strong>anti-D (Rh)</strong> {sample.Rh ? <><em>(+)</em></> : <><em>(−)</em></>}
        .
      </p>
    );
    if (enableCombinedAB) {
      items.push(
        <p key="p2" className="text-white/80 text-sm">
          <strong>anti-A,B (combinado).</strong> Se usa como <em>cribado</em> de antígenos <strong>A</strong> o <strong>B</strong>:
          será {sample.A || sample.B ? <><em>positivo</em></> : <><em>negativo</em></>} si existe al menos uno de ellos.
        </p>
      );
    }
    items.push(
      <p key="p3" className="text-white/80 text-sm">
        <strong>Regla.</strong> <em>Si hay aglutinación con anti-X, el antígeno X está presente en los eritrocitos; si no hay,
        el antígeno X está ausente.</em>
      </p>
    );
    items.push(
      <ul key="ul" className="mt-1 list-disc pl-5 text-xs text-white/70">
        <li><strong>anti-A (+)</strong> ⇒ antígeno <strong>A</strong> presente</li>
        <li><strong>anti-B (+)</strong> ⇒ antígeno <strong>B</strong> presente</li>
        <li><strong>anti-D (+)</strong> ⇒ <strong>Rh positivo</strong></li>
      </ul>
    );
    items.push(
      <p key="p4" className="text-white/80 text-sm">
        <strong>Conclusión.</strong> Con ese patrón se <em>infiere</em> el grupo ABO y el Rh sin necesidad de mostrar la respuesta literal.
      </p>
    );
    return <div className="space-y-2">{items}</div>;
  }

  function openModal({ title, body, tone, anim }) {
    setModalTitle(title);
    setModalBody(body);
    setModalTone(tone);
    setModalAnim(anim);
    setModalOpen(true);
  }

  function handleCheck(autoTimeout = false) {
    if (mode === "evaluacion" && attemptCount >= MAX_ATTEMPTS) return;

    const isCorrect = !autoTimeout && correct;
    setChecked(true);

    const entry = {
      ts: Date.now(),
      mode,
      guessABO,
      guessRh,
      correct: isCorrect,
      added: { ...added },
      timeUsedSec: EVAL_SECONDS - (mode === "evaluacion" ? timeLeft : EVAL_SECONDS),
      score: computeScore(isCorrect, added, mode === "evaluacion" ? timeLeft : EVAL_SECONDS),
    };

    onAttemptRecorded?.(entry);
    if (mode === "evaluacion") setAttemptCount((c) => c + 1);

    // Mostrar explicación formateada (negritas/cursivas) sin revelar la respuesta
    const coreBody = (
      <div className="space-y-2">
        <p className={isCorrect ? "text-emerald-300 font-semibold" : "text-rose-300 font-semibold"}>
          {isCorrect ? "¡Correcto!" : autoTimeout ? "Tiempo agotado" : "Incorrecto"}
        </p>
        {explanationFragment()}
      </div>
    );

    openModal({
      title: mode === "evaluacion" ? "Resultado" : "Comprobación",
      body: coreBody,
      tone: isCorrect ? "success" : "error",
      anim: isCorrect ? successAnim : errorAnim,
    });
  }

  function resetAll(newRandom = true) {
    setAdded({ A: false, B: false, D: false, AB: false });
    setChecked(null);
    if (mode === "evaluacion") setTimeLeft(EVAL_SECONDS);
    if (newRandom) setSample(makeRandomSample());
    setWellSeed((s) => s + 1);
  }

  function toggleReagent(key) {
    if (!interactionsEnabled) return;
    setAdded((v) => {
      const next = !v[key];
      try { playToggle(next); } catch {}
      if (navigator.vibrate) navigator.vibrate(next ? [15, 25] : 15);
      return { ...v, [key]: next };
    });
  }

  // Atajos: 1=A, 2=B, 3=D, 4=AB, C/Enter=Comprobar, L=Limpiar, N=Nueva
  useEffect(() => {
    const onKey = (e) => {
      if (!interactionsEnabled) return;
      const k = e.key.toLowerCase();
      if (k === "1") toggleReagent("A");
      else if (k === "2") toggleReagent("B");
      else if (k === "3") toggleReagent("D");
      else if (k === "4" && enableCombinedAB) toggleReagent("AB");
      else if (k === "c" || e.key === "Enter") handleCheck(false);
      else if (k === "l") {
        setAdded({ A: false, B: false, D: false, AB: false });
        try { playToggle(false); } catch {}
        if (navigator.vibrate) navigator.vibrate(15);
      } else if (k === "n") {
        resetAll(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionsEnabled, enableCombinedAB]);

  const ABO_TYPES = ["O", "A", "B", "AB"];
  const disabledClass = !interactionsEnabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <section id="simulacion" className="mx-auto max-w-7xl px-5 py-16">
      <SectionTitle
        kicker="Simulación"
        title={uiVariant === "free" ? "Práctica libre de tipificación" : "Práctica de tipificación"}
        subtitle={
          uiVariant === "free"
            ? "Explora libremente: añade reactivos, observa la reacción y formula tu hipótesis."
            : mode === "evaluacion"
            ? `Modo Evaluación: intentos limitados (${MAX_ATTEMPTS}) y temporizador activo (${EVAL_SECONDS}s).`
            : "Añade reactivos, observa la reacción y comprueba tu hipótesis."
        }
      />

      {uiVariant !== "free" && (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-md bg-white/5 px-3 py-1.5">
                Modo: <strong className="ml-1 capitalize">{mode}</strong>
              </span>
              <span className="rounded-md bg-white/5 px-3 py-1.5">
                Intentos:{" "}
                <strong className="ml-1">
                  {mode === "evaluacion" ? `${attemptCount} / ${MAX_ATTEMPTS}` : "—"}
                </strong>
              </span>
              {mode === "evaluacion" && (
                <span className="rounded-md bg-white/5 px-3 py-1.5">
                  Tiempo: <strong className="ml-1">{timeLeft}s</strong>
                </span>
              )}
            </div>
          </Card>
          <Card>
            <p className="text-sm text-white/80">El modal explica el razonamiento sin mostrar la respuesta literal.</p>
          </Card>
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        {/* Pozos */}
        <Card className="order-2 lg:order-1">
          <h3 className="text-lg font-semibold">Pozos de reacción</h3>
          <p className="mt-1 text-sm text-white/70">
            Añade el reactivo y observa si aparece aglutinación. (La <em>gota</em> que cae ahora es más oscura y gruesa.)
          </p>

          <div className={`mt-6 grid ${enableCombinedAB ? "grid-cols-4" : "grid-cols-3"} gap-6`}>
            <ReactionWell label="anti-A" added={added.A} agglutinates={results.antiA} seed={wellSeed} />
            <ReactionWell label="anti-B" added={added.B} agglutinates={results.antiB} seed={wellSeed} />
            <ReactionWell label="anti-D (Rh)" added={added.D} agglutinates={results.antiD} seed={wellSeed} />
            {enableCombinedAB && (
              <ReactionWell
                label="anti-A,B (opcional)"
                added={added.AB}
                agglutinates={results.antiAB}
                seed={wellSeed}
              />
            )}
          </div>

          <div className={`mt-6 grid ${enableCombinedAB ? "grid-cols-4" : "grid-cols-3"} gap-3`}>
            <button
              onClick={() => toggleReagent("A")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${disabledClass} ${
                added.A ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
              disabled={!interactionsEnabled}
              aria-pressed={added.A}
              title="Anti-A (tecla 1)"
            >
              {added.A ? "Quitar anti-A" : "Añadir anti-A"}
            </button>
            <button
              onClick={() => toggleReagent("B")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${disabledClass} ${
                added.B ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
              disabled={!interactionsEnabled}
              aria-pressed={added.B}
              title="Anti-B (tecla 2)"
            >
              {added.B ? "Quitar anti-B" : "Añadir anti-B"}
            </button>
            <button
              onClick={() => toggleReagent("D")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${disabledClass} ${
                added.D ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
              disabled={!interactionsEnabled}
              aria-pressed={added.D}
              title="Anti-D (tecla 3)"
            >
              {added.D ? "Quitar anti-D" : "Añadir anti-D"}
            </button>
            {enableCombinedAB && (
              <button
                onClick={() => toggleReagent("AB")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${disabledClass} ${
                  added.AB ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-white/90 hover:bg-white/20"
                }`}
                disabled={!interactionsEnabled}
                aria-pressed={added.AB}
                title="Anti-A,B combinado (tecla 4)"
              >
                {added.AB ? "Quitar anti-A,B" : "Añadir anti-A,B"}
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!interactionsEnabled) return;
                setAdded({ A: false, B: false, D: false, AB: false });
                try { playToggle(false); } catch {}
                if (navigator.vibrate) navigator.vibrate(15);
              }}
              className={`rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 ${disabledClass}`}
              disabled={!interactionsEnabled}
              title="Limpiar (tecla L)"
            >
              Limpiar pozos
            </button>
            <button
              onClick={() => interactionsEnabled && resetAll(true)}
              className={`rounded-xl bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B21C2D] ${disabledClass}`}
              disabled={!interactionsEnabled}
              title="Nueva muestra (tecla N)"
            >
              Nueva muestra
            </button>
          </div>
        </Card>

        {/* Hipótesis */}
        <Card className="order-1 lg:order-2">
          <h3 className="text-lg font-semibold">Tu hipótesis</h3>
          <p className="mt-1 text-sm text-white/70">Selecciona el grupo ABO y el factor Rh.</p>

          <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
            {["O","A","B","AB"].map((t) => (
              <button
                key={t}
                onClick={() => interactionsEnabled && setGuessABO(t)}
                className={`rounded-xl px-3 py-2 font-semibold ${disabledClass} ${
                  guessABO === t ? "bg-[#D7263D] text-white" : "bg-white/10 text-white/90 hover:bg-white/20"
                }`}
                disabled={!interactionsEnabled}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2 text-sm">
            <button
              onClick={() => interactionsEnabled && setGuessRh(true)}
              className={`rounded-xl px-3 py-2 font-semibold ${disabledClass} ${
                guessRh ? "bg-[#D7263D] text-white" : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
              disabled={!interactionsEnabled}
            >
              Rh +
            </button>
            <button
              onClick={() => interactionsEnabled && setGuessRh(false)}
              className={`rounded-xl px-3 py-2 font-semibold ${disabledClass} ${
                !guessRh ? "bg-[#D7263D] text-white" : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
              disabled={!interactionsEnabled}
            >
              Rh −
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => interactionsEnabled && handleCheck(false)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                !interactionsEnabled ? "bg-white/5 cursor-not-allowed opacity-50" : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              }`}
              disabled={!interactionsEnabled}
            >
              Comprobar
            </button>

            <button
              onClick={() =>
                openModal({
                  title: "Cómo se infiere el resultado",
                  body: explanationFragment(),
                  tone: "success",
                  anim: successAnim,
                })
              }
              className={`rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 ${disabledClass}`}
              disabled={!interactionsEnabled}
            >
              Ver explicación
            </button>
          </div>
        </Card>
      </div>

      {/* Modal: sin autocierre; se cierra con X o clic fuera */}
      <Modal
        open={modalOpen}
        title={modalTitle}
        tone={modalTone}
        lottieAnim={modalAnim}
        onClose={() => {
          setModalOpen(false);
          // tras cerrar manualmente, reiniciamos para nueva práctica
          resetAll(true);
        }}
      >
        {modalBody}
      </Modal>
    </section>
  );
}
