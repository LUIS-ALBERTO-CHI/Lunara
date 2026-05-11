import { NextResponse } from 'next/server';

const prompts = [
  {
    question: "¿Qué pequeña magia encontraste hoy?",
    description: "Tómate un momento para observar los detalles sutiles que iluminaron tu camino."
  },
  {
    question: "¿Dónde sentiste mayor equilibrio o desequilibrio?",
    description: "Explora tus emociones de hoy sin juzgarlas, buscando tu centro natural."
  },
  {
    question: "¿Qué agradeces haber soltado en este día?",
    description: "Reflexiona sobre aquello que decidiste no cargar para mantener tu paz mental."
  },
  {
    question: "¿Cómo nutriste tu armonía interior hoy?",
    description: "Escribe sobre esa pausa, límite o respiro que te diste para reconectar contigo."
  },
  {
    question: "¿Qué mensaje crees que el Universo intentó darte hoy?",
    description: "Presta atención a las sincronías, números o palabras repetidas que se cruzaron en tu día."
  },
  {
    question: "¿Si tu energía de hoy tuviera un color, cuál sería y por qué?",
    description: "Visualiza tu aura y describe qué emociones le dieron ese matiz."
  },
  {
    question: "¿Qué verdad incómoda pero necesaria abrazaste hoy?",
    description: "La luz también nace de reconocer nuestras propias sombras y aceptarlas."
  },
  {
    question: "¿A quién o a qué le entregaste tu energía más pura?",
    description: "Analiza en qué invertiste tu vitalidad y si esa entrega fue correspondida o nutritiva."
  }
];

export async function GET() {
  try {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    const selectedPrompt = prompts[randomIndex];
    
    return NextResponse.json(selectedPrompt);
  } catch (error) {
    return NextResponse.json({
      question: "¿Qué pequeña magia encontraste hoy?",
      description: "Tómate un momento para observar los detalles sutiles que iluminaron tu camino."
    });
  }
}