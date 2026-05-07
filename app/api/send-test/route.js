import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST() {
  try {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error('Faltan las variables de entorno VAPID');
      return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:albchicasanova16@gmail.com', // Reemplaza con tu email real
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // 1. Obtener todas las suscripciones de nuestra BD Neon
    const { rows: subscriptions } = await sql`SELECT * FROM subscriptions`;

    const payload = JSON.stringify({
      title: '¡Notificación de Test!',
      body: 'Esto es una prueba de PWA con Vercel y Neon.',
    });

    // 2. Enviar el evento push a cada dispositivo
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        // Si el endpoint ya no es válido (código 410 o 404), lo eliminamos de la BD.
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Eliminando suscripción obsoleta: ${sub.endpoint}`);
          await sql`DELETE FROM subscriptions WHERE endpoint = ${sub.endpoint}`;
        } else {
          console.error('Error enviando notificación a:', sub.endpoint, err);
        }
      }
    });

    await Promise.all(sendPromises);
    return NextResponse.json({ success: true, count: subscriptions.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error enviando notificación' }, { status: 500 });
  }
}
