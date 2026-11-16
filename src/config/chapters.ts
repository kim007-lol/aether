export const chapters = [
  { id: 'arrival', name: 'Arrival', label: '01 — Arrival', range: [0, 0.16], headline: 'A world that breathes light.', body: 'Four billion years of weather, drawn in a single glance. Aether turns slowly, as if it knew you were coming.' },
  { id: 'atmosphere', name: 'Atmosphere', label: '02 — Atmosphere', range: [0.16, 0.34], headline: 'Where day lets go of night.', body: 'At the terminator, cities wake in gold while storms rewrite the sky below. Every cloud here is computed, not painted.' },
  { id: 'rings', name: 'Rings', label: '03 — Rings', range: [0.34, 0.52], headline: 'Ten thousand years, in motion.', body: 'Hundreds of thousands of fragments of ice and stone keep a quiet orbit. Slip between them.' },
  { id: 'debris', name: 'Debris', label: '04 — Debris', range: [0.52, 0.70], headline: 'The ruins of a moon that never formed.', body: 'Each rock carries its own scars. Fly close enough to read them.' },
  { id: 'nebula', name: 'Nebula', label: '05 — Nebula', range: [0.70, 0.86], headline: 'Light, before it learns a name.', body: 'A cloud of ionized gas, lit from within by stars not yet born.' },
  { id: 'core', name: 'Core', label: '06 — Core', range: [0.86, 1], headline: 'Touch the heart of it.', body: 'Everything you passed was only its echo. Move your cursor. It answers.' },
] as const;
export function chapterAt(progress: number): number {
  for (let i = chapters.length - 1; i >= 0; i--) if (progress >= chapters[i].range[0]) return i;
  return 0;
}
export const chapterStops = [0, 0.25, 0.43, 0.64, 0.78, 1] as const;
