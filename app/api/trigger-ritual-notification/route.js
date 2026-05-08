import { NextResponse } from 'next/server';

/**
 * Endpoint para disparar manualmente el envío de notificaciones de nuevo ritual
 * Requiere un token secreto para seguridad
 * 
 * Uso: POST /api/trigger-ritual-notification
 * Body: { secret: "tu-token-secreto-aqui" }
 */
export async function POST(request) {
  try {
    const { secret } = await request.json();
    const RITUAL_SECRET = process.env.RITUAL_NOTIFICATION_SECRET || 'change-me-in-production';

    // Validar el token secreto
    if (secret !== RITUAL_SECRET) {
      return NextResponse.json({ error: 'Token no válido' }, { status: 401 });
    }

    // Llamar al endpoint de envío de rituales
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/send-daily-ritual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Error al enviar notificaciones' }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en trigger-ritual-notification:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
