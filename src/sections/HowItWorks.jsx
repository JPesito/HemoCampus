import React from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import Card from "../components/Card.jsx";

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-16">
      <SectionTitle
        kicker="Metodología"
        title="Cómo se determina el grupo ABO/Rh"
        subtitle="Añadir antisueros, observar aglutinación y deducir el tipo con base en antígenos en eritrocitos."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Card>
          <h3 className="text-lg font-semibold">1. Añadir antisuero</h3>
          <p className="mt-2 text-sm text-white/70">Gotas de <span className="font-medium">anti-A</span>, <span className="font-medium">anti-B</span> y <span className="font-medium">anti-D</span> en pozos separados.</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">2. Observar aglutinación</h3>
          <p className="mt-2 text-sm text-white/70">Aglutinación indica presencia del antígeno correspondiente; anti-D revela factor Rh (D).</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">3. Deducir el tipo</h3>
          <p className="mt-2 text-sm text-white/70">anti-A → A, anti-B → B, ambos → AB, ninguno → O; anti-D define Rh.</p>
        </Card>
      </div>
    </section>
  );
}
