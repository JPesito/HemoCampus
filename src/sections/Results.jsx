import React from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import Card from "../components/Card.jsx";

export default function Results() {
  return (
    <section id="resultados" className="mx-auto max-w-7xl px-5 py-16">
      <SectionTitle kicker="Resultados de aprendizaje" title="Competencias que desarrolla el estudiante" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card>
          <ul className="list-inside list-disc text-sm text-white/80">
            <li>Relaciona antígeno presente en eritrocito con el antisuero que produce aglutinación.</li>
            <li>Interpreta patrones de reacción para deducir grupo ABO y factor Rh.</li>
            <li>Describe diferencias entre tipificación directa y reversa.</li>
            <li>Aplica razonamiento experimental seleccionando sólo los reactivos necesarios.</li>
          </ul>
        </Card>
        <Card>
          <div className="text-sm text-white/80">
            <p className="font-semibold">Correcto científico</p>
            <p className="mt-2">• anti-A → antígeno A. • anti-B → antígeno B. • anti-D → antígeno D (Rh). Ausencia de aglutinación = antígeno ausente.</p>
            <p className="mt-2">Recomendadas prácticas de bioseguridad (guantes, bata, descartes adecuados) en laboratorio real.</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
