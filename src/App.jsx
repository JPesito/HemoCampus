import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

// Landing (home) con secciones existentes
import Nav from "./sections/Nav.jsx";
import Hero from "./sections/Hero.jsx";
import HowItWorks from "./sections/HowItWorks.jsx";
import Demo from "./sections/Demo.jsx";
import Results from "./sections/Results.jsx";
import FAQ from "./sections/FAQ.jsx";
import Footer from "./sections/Footer.jsx";
import Arcade from "./sections/Arcade.jsx";

// Páginas nuevas
import TeacherCreateSession from "./pages/TeacherCreateSession.jsx";
import StudentSession from "./pages/StudentSession.jsx";

function Home() {
  // Scroll suave para anclas
  useEffect(() => {
    const handler = (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gradient-to-br from-[#0B1E3A] via-[#123158] to-[#071C36] text-white">
        <Hero />
        <HowItWorks />
        <Demo modeOverride="libre" uiVariant="free" />
        <Results />
        <FAQ />
        <Footer />
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/docente" element={<TeacherCreateSession />} />
      <Route path="/sesion/:sessionId" element={<StudentSession />} />
      <Route path="/arcade" element={<Arcade />} />
      {/* 404 simple */}
      <Route path="*" element={
        <div className="min-h-screen grid place-items-center bg-[#0B1E3A] text-white">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Página no encontrada</h1>
            <a href="/" className="mt-4 inline-block rounded bg-white/10 px-4 py-2 hover:bg-white/20">Volver al inicio</a>
          </div>
        </div>
      } />
    </Routes>
  );
}
