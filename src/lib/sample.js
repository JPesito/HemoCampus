export function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function makeRandomSample() {
  const abo = rand(["O", "A", "B", "AB"]);
  const rh = Math.random() < 0.8; // Rh+ más frecuente
  return { A: abo === "A" || abo === "AB", B: abo === "B" || abo === "AB", Rh: rh };
}

export function sampleToABO(sample) {
  if (sample.A && sample.B) return "AB";
  if (sample.A) return "A";
  if (sample.B) return "B";
  return "O";
}

export function sampleToLabel(sample) {
  return `${sampleToABO(sample)}${sample.Rh ? "+" : "-"}`;
}
