import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import webpush from 'web-push';

// Configurar web-push con tus claves VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function GET() {
  try {
    // 1. Obtener la frase en inglés de la API externa
    const apiRes = await fetch('https://dummyjson.com/quotes/random', { cache: 'no-store' });
    if (!apiRes.ok) {
      return NextResponse.json({ ritual: "Respira profundo y agradece por un nuevo día. El universo te guía." });
    }
    const apiData = await apiRes.json();
    const quoteEn = apiData.quote;

    // 2. Traducirla al español usando la API pública de Google Translate
    const translateRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(quoteEn)}`, 
      { cache: 'no-store' }
    );
    if (!translateRes.ok) {
      return NextResponse.json({ ritual: "Respira profundo y agradece por un nuevo día. El universo te guía." });
    }
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

export async function POST(request) {
  try {
    // 1. Obtener el ritual
    const apiRes = await fetch('https://dummyjson.com/quotes/random', { cache: 'no-store' });
    if (!apiRes.ok) {
      return NextResponse.json({ error: 'No se pudo obtener el ritual' }, { status: 500 });
    }
    const apiData = await apiRes.json();
    const quoteEn = apiData.quote;

    // 2. Traducir al español
    const translateRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(quoteEn)}`, 
      { cache: 'no-store' }
    );
    if (!translateRes.ok) {
      return NextResponse.json({ error: 'No se pudo traducir el ritual' }, { status: 500 });
    }
    const translateData = await translateRes.json();
    let ritual = translateData[0]?.[0]?.[0];

    if (!ritual) {
      ritual = "Respira profundo y agradece por un nuevo día. El universo te guía.";
    }

    // 3. Obtener todas las suscripciones de Neon
    const subscriptionsResult = await sql`
      SELECT endpoint, p256dh, auth FROM subscriptions;
    `;

    const subscriptions = subscriptionsResult.rows;

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        message: 'No hay suscriptores para notificar',
        sentTo: 0
      });
    }

    // 4. Crear el payload de la notificación
    const notificationPayload = JSON.stringify({
      title: '✨ Nuevo Ritual Cósmico',
      body: ritual,
      icon: '/manifest.json',
      badge: '/manifest.json',
      tag: 'ritual-notification',
      requireInteraction: false
    });

    // 5. Enviar notificación push a cada suscriptor
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);
        return { success: true, endpoint: sub.endpoint };
      } catch (error) {
        console.error(`Error enviando notificación a ${sub.endpoint}:`, error.message);
        
        // Si la suscripción es inválida (410 Gone), eliminarla de la BD
        if (error.statusCode === 410) {
          try {
            await sql`DELETE FROM subscriptions WHERE endpoint = ${sub.endpoint};`;
          } catch (deleteError) {
            console.error('Error eliminando suscripción inválida:', deleteError);
          }
        }
        
        return { success: false, endpoint: sub.endpoint, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      ritual: ritual,
      sentTo: successCount,
      total: subscriptions.length,
      results: results
    });

  } catch (error) {
    console.error('Error en send-daily-ritual POST:', error);
    return NextResponse.json({ error: 'Error al enviar notificaciones' }, { status: 500 });
  }
}