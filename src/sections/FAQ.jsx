import React from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import Card from "../components/Card.jsx";

export default function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-7xl px-5 py-16">
      <SectionTitle kicker="FAQ" title="Preguntas frecuentes" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card>
          <h4 className="text-base font-semibold">¿Incluye factor Rh?</h4>
          <p className="mt-2 text-sm text-white/80">Sí. Se simula la reacción con anti-D para determinar si la muestra es Rh positiva o negativa.</p>
        </Card>
        <Card>
          <h4 className="text-base font-semibold">¿Es una herramienta de diagnóstico?</h4>
          <p className="mt-2 text-sm text-white/80">No. Está diseñada con fines educativos para reforzar conceptos de inmunohematología.</p>
        </Card>
        <Card>
          <h4 className="text-base font-semibold">¿Se puede integrar a una plataforma LMS?</h4>
          <p className="mt-2 text-sm text-white/80">La demo es un componente React autónomo. Puede integrarse en LMS mediante iframe o como módulo de una app web.</p>
        </Card>
        <Card>
          <h4 className="text-base font-semibold">¿Cómo se evalúa?</h4>
          <p className="mt-2 text-sm text-white/80">Puede complementarse con rúbricas y exportación de resultados. La demo ya valida hipótesis y permite múltiples intentos.</p>
        </Card>
      </div>
    </section>
  );
}
