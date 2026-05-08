import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    // Obtenemos el parámetro del signo que envías desde el frontend (ej. "libra")
    const sign = searchParams.get('sign') || 'libra';

    // Llamamos a una API pública (wttr) para obtener la fase de la luna actual
    // Retorna un formato como "🌖 Waning Gibbous"
    const res = await fetch('https://wttr.in/?format=%m+%M', { cache: 'no-store' });
    const moonData = await res.text();

    // Mapa de traducción para las fases lunares
    const phaseMap = {
      'New Moon': 'Luna Nueva',
      'Waxing Crescent': 'Luna Creciente',
      'First Quarter': 'Cuarto Creciente',
      'Waxing Gibbous': 'Gibosa Creciente',
      'Full Moon': 'Luna Llena',
      'Waning Gibbous': 'Gibosa Menguante',
      'Last Quarter': 'Cuarto Menguante',
      'Waning Crescent': 'Luna Menguante',
    };

    const englishPhase = moonData.replace(/[^\w\s]/gi, '').trim();
    const translatedPhase = phaseMap[englishPhase] || 'Fase Lunar';
    const capitalizedSign = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();

    return NextResponse.json({ phase: `${translatedPhase} en ${capitalizedSign}` });
  } catch (error) {
    console.error('Error obteniendo fase lunar:', error);
    return NextResponse.json({ phase: 'Creciente en Libra' }); // Fallback seguro
  }
}
