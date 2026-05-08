import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Obtener la frase en inglés de la API externa
    const apiRes = await fetch('https://dummyjson.com/quotes/random', { cache: 'no-store' });
    const apiData = await apiRes.json();
    const quoteEn = apiData.quote;

    // 2. Traducirla al español usando la API pública de Google Translate
    const translateRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(quoteEn)}`, 
      { cache: 'no-store' }
    );
    const translateData = await translateRes.json();
    
    // 3. Extraer el texto traducido del arreglo de respuesta de Google
    let ritual = translateData[0]?.[0]?.[0];

    if (!ritual) {
      ritual = "Respira profundo y agradece por un nuevo día. El universo te guía."; 
    }

    return NextResponse.json({ ritual });
  } catch (error) {
    console.error('Error al obtener el ritual:', error);
    return NextResponse.json({ error: 'Error al obtener el ritual diario' }, { status: 500 });
  }
}