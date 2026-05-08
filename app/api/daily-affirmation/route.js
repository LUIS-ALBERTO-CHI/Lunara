import { sql } from '@vercel/postgres';
import webpush from 'web-push';

// Configurar web-push con tus claves VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Afirmaciones positivas en español
const affirmations = [
  "Soy luz, soy paz, soy suficiente",
  "Cada día es una nueva oportunidad para ser mejor",
  "Mi potencial es ilimitado y mis sueños son posibles",
  "Merezco amor, éxito y felicidad",
  "Mis acciones hoy crean mi mañana exitoso",
  "Soy fuerte, valiente y capaz de lograr cualquier cosa",
  "La gratitud transforma mi vida en abundancia",
  "Mi mente es poderosa y mi espíritu es indestructible",
  "Elijo ser feliz y vivir con propósito",
  "Soy digno de todos los logros que deseo alcanzar",
  "La adversidad me fortalece y me hace más sabio",
  "Tengo el poder de cambiar mi vida hoy",
  "Mi energía es contagiosa y atrae lo positivo",
  "Soy versátil, valioso y estoy en constante crecimiento",
  "Cada desafío es una oportunidad para brillar",
  "Mi mente está llena de posibilidades infinitas",
  "Soy creador de mi propio destino y éxito",
  "La paz interior es mi derecho natural",
  "Soy generador de cambio positivo en el mundo",
  "Hoy elijo amor, esperanza y acción",
];

export async function GET(request) {
  try {
    // Obtener afirmación aleatoria
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    const affirmation = affirmations[randomIndex];

    return Response.json({
      affirmation,
      date: new Date().toLocaleDateString('es-ES'),
    });
  } catch (error) {
    console.error('Error al obtener afirmación:', error);
    return Response.json(
      { error: 'Error al obtener la afirmación' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Obtener afirmación aleatoria
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    const affirmation = affirmations[randomIndex];
    const today = new Date().toISOString().split('T')[0];

    // 1. Obtener todas las suscripciones de Neon
    const subscriptionsResult = await sql`
      SELECT endpoint, p256dh, auth FROM subscriptions;
    `;

    const subscriptions = subscriptionsResult.rows;

    if (subscriptions.length === 0) {
      return Response.json({
        success: true,
        affirmation: affirmation,
        sentTo: 0,
        message: 'No hay suscriptores para notificar'
      });
    }

    // 2. Crear el payload de la notificación
    const notificationPayload = JSON.stringify({
      title: '💫 Tu Afirmación del Día',
      body: affirmation,
      icon: '/manifest.json',
      badge: '/manifest.json',
      tag: 'affirmation-notification',
      requireInteraction: false
    });

    // 3. Enviar notificación push a cada suscriptor
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

    return Response.json({
      success: true,
      affirmation: affirmation,
      sentTo: successCount,
      total: subscriptions.length,
      date: today,
      results: results
    });
  } catch (error) {
    console.error('Error en daily-affirmation POST:', error);
    return Response.json(
      { error: 'Error al enviar notificaciones' },
      { status: 500 }
    );
  }
}
