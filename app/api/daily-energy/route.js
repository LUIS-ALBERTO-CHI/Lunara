import { NextResponse } from 'next/server';

const energyStates = [
  { title: "Tu Universo está en calma", message: "Alma Estelar, tu energía vibra hoy en" },
  { title: "El cosmos te sonríe", message: "Luz Radiante, tu frecuencia resuena en" },
  { title: "Alineación perfecta", message: "Viajero Cósmico, tu aura brilla en" },
  { title: "Día de manifestación", message: "Ser Consciente, tu vibración se eleva a" },
  { title: "Paz interior profunda", message: "Espíritu Libre, sintonizas hoy a" },
];

export async function GET() {
  try {
    const randomState = energyStates[Math.floor(Math.random() * energyStates.length)];
    // Frecuencia aleatoria entre 432 Hz (frecuencia sanadora) y 999 Hz
    const randomHz = Math.floor(Math.random() * (999 - 432 + 1)) + 432;

    return NextResponse.json({
      title: randomState.title,
      message: `${randomState.message} ${randomHz} Hz`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener la energía diaria' }, { status: 500 });
  }
}