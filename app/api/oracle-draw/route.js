import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Obtener una carta aleatoria de la API de Tarot
    const apiRes = await fetch('https://tarotapi.dev/api/v1/cards/random?n=1', { cache: 'no-store' });
    if (!apiRes.ok) throw new Error('Falló la conexión con Tarot API');
    const data = await apiRes.json();
    const card = data.cards[0];

    // 2. Traducir el nombre y el significado usando Google Translate
    // Juntamos ambos textos con un separador "|" para hacer una sola petición a Google
    const textToTranslate = `${card.name}|${card.meaning_up}`;
    const translateRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(textToTranslate)}`, 
      { cache: 'no-store' }
    );
    
    let nameEs = card.name;
    let meaningEs = card.meaning_up;

    if (translateRes.ok) {
      const translateData = await translateRes.json();
      const translatedText = translateData[0].map(item => item[0]).join('');
      const parts = translatedText.split('|');
      if (parts.length >= 2) {
        nameEs = parts[0].trim();
        meaningEs = parts.slice(1).join('|').trim();
      }
    }

    // 3. Devolver los datos al frontend
    return NextResponse.json({ name: nameEs, meaning: meaningEs, type: card.type });
  } catch (error) {
    console.error('Error obteniendo la carta del oráculo:', error);
    return NextResponse.json({ name: 'El Loco', meaning: 'Nuevos comienzos, espontaneidad, fe en el universo. Es el momento de dar un salto hacia lo desconocido con el corazón abierto.', type: 'major' });
  }
}