import { NextResponse } from 'next/server';

/**
 * Endpoint para disparar manualmente el envío de notificaciones
 * Requiere un token secreto para seguridad
 * 
 * Uso: POST /api/trigger-ritual-notification
 * 
 * Opciones:
 * - Ritual aleatorio: { secret: "tu-token", type: "ritual" }
 * - Afirmación del día: { secret: "tu-token", type: "affirmation" }
 * - Manifestación personalizada: { secret: "tu-token", type: "manifestation", message: "Tu mensaje" }
 */
export async function POST(request) {
  try {
    const { secret, type = 'ritual', message } = await request.json();
    const RITUAL_SECRET = process.env.RITUAL_NOTIFICATION_SECRET || 'change-me-in-production';

    // Validar el token secreto
    if (secret !== RITUAL_SECRET) {
      return NextResponse.json({ error: 'Token no válido' }, { status: 401 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Enviar ritual aleatorio
    if (type === 'ritual') {
      const response = await fetch(`${baseUrl}/api/send-daily-ritual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Error al enviar notificaciones' }, { status: 500 });
      }

      const result = await response.json();
      return NextResponse.json(result);
    }

    // Enviar afirmación del día
    else if (type === 'affirmation') {
      const response = await fetch(`${baseUrl}/api/daily-affirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Error al enviar afirmación' }, { status: 500 });
      }

      const result = await response.json();
      return NextResponse.json(result);
    }

    // Enviar manifestación personalizada
    else if (type === 'manifestation') {
      if (!message || message.trim().length === 0) {
        return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
      }

      const response = await fetch(`${baseUrl}/api/manifestations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          sendNotification: true
        })
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Error al crear manifestación' }, { status: 500 });
      }

      const result = await response.json();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Tipo no válido. Use "ritual", "affirmation" o "manifestation"' }, { status: 400 });
  } catch (error) {
    console.error('Error en trigger-ritual-notification:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
