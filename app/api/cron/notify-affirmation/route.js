import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:hola@vighnaharta.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function GET(request) {
  try {
    // 1. Obtener la nueva afirmación del día usando tu API existente
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const apiUrl = `${protocol}://${host}/api/daily-affirmation`;

    let affirmation = 'Soy luz, soy paz, soy suficiente.';
    try {
      const apiRes = await fetch(apiUrl, { cache: 'no-store' });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.affirmation) affirmation = data.affirmation;
      }
    } catch (e) {
      console.error('Error al obtener la afirmación internamente, usando fallback', e);
    }

    // 2. Obtener todas las suscripciones activas
    const { rows } = await sql`SELECT subscription_data FROM subscriptions`;

    if (rows.length === 0) {
      return NextResponse.json({ message: 'No hay suscriptores para notificar' });
    }

    // 3. Crear el mensaje que aparecerá en el celular
    const payload = JSON.stringify({
      title: '✨ Nueva Afirmación del Día',
      body: `"${affirmation}"\nTómate un momento para sintonizar con esta energía.`,
      icon: '/icon-192x192.png',
      url: '/'
    });

    // 4. Disparar notificaciones masivas
    const notifications = rows.map(async (row) => {
      const sub = typeof row.subscription_data === 'string' ? JSON.parse(row.subscription_data) : row.subscription_data;
      return webpush.sendNotification(sub, payload).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await sql`DELETE FROM subscriptions WHERE endpoint = ${sub.endpoint}`;
        }
      });
    });

    await Promise.all(notifications);
    return NextResponse.json({ success: true, sentTo: rows.length, affirmation });
  } catch (error) {
    console.error('Error enviando push de afirmación:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}