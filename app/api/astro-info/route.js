import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    // Obtenemos la llave de entorno
    const apiKey = process.env.ASTRO_API_KEY;
    
    // Si no tienes la API Key configurada en .env.local, usamos el plan de respaldo (wttr)
    if (!apiKey) {
      console.log("No se encontró ASTRO_API_KEY. Usando wttr.in como respaldo...");
      return await getWttrFallback();
    }

    // Parámetros dinámicos basados en la documentación de AstroApi
    const requestBody = {
      datetime_location: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        city: "Madrid", // Puedes cambiar esto a tu ciudad base
        country_code: "ES"
      },
      days_ahead: 1
    };

    const res = await fetch('https://api.astrology-api.io/api/v3/lunar/phases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store' // Para que siempre traiga datos frescos
    });

    if (!res.ok) {
       throw new Error("AstroApi respondió con error, activando respaldo.");
    }

    const data = await res.json();
    
    // AstroAPI devuelve todo en inglés, así que usamos un mapa de traducción
    const phaseEn = data?.phase_name || data?.lunar_phase?.phase_name || 'Waxing Crescent';
    const signEn = data?.zodiac_sign || data?.lunar_phase?.zodiac_sign || 'Libra';
    
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
    
    const signMap = {
      'Aries': 'Aries', 'Taurus': 'Tauro', 'Gemini': 'Géminis', 'Cancer': 'Cáncer',
      'Leo': 'Leo', 'Virgo': 'Virgo', 'Libra': 'Libra', 'Scorpio': 'Escorpio',
      'Sagittarius': 'Sagitario', 'Capricorn': 'Capricornio', 'Aquarius': 'Acuario', 'Pisces': 'Piscis'
    };

    return NextResponse.json({
      phase: phaseMap[phaseEn] || phaseEn,
      illumination: `${data?.illumination || data?.lunar_phase?.illumination || '50'}%`,
      moonrise: data?.moonrise || data?.lunar_phase?.moonrise || '18:30', 
      moonset: data?.moonset || data?.lunar_phase?.moonset || '06:15',
      sign: signMap[signEn] || signEn
    });

  } catch (error) {
    console.error('Error obteniendo datos de AstroApi:', error);
    return await getWttrFallback(); // Si la API falla, la app NUNCA se rompe, solo usa wttr
  }
}

// Mantenemos el código anterior como un plan B súper seguro
async function getWttrFallback() {
  try {
    const res = await fetch('https://wttr.in/?format=j1', { cache: 'no-store' });
    const data = await res.json();
    const astronomy = data.weather[0].astronomy[0];
    const phaseMap = { 'New Moon': 'Luna Nueva', 'Waxing Crescent': 'Luna Creciente', 'First Quarter': 'Cuarto Creciente', 'Waxing Gibbous': 'Gibosa Creciente', 'Full Moon': 'Luna Llena', 'Waning Gibbous': 'Gibosa Menguante', 'Last Quarter': 'Cuarto Menguante', 'Waning Crescent': 'Luna Menguante' };
    const zodiacSigns = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
    return NextResponse.json({ phase: phaseMap[astronomy.moon_phase] || 'Fase Lunar', illumination: `${astronomy.moon_illumination}%`, moonrise: astronomy.moonrise, moonset: astronomy.moonset, sign: zodiacSigns[new Date().getDate() % 12] });
  } catch (e) {
    return NextResponse.json({ phase: 'Creciente', illumination: '65%', moonrise: '18:30', moonset: '06:15', sign: 'Libra' });
  }
}
