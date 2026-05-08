import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { endpoint, keys } = await request.json();
    
    // Guardamos la suscripción en Neon. 
    // ON CONFLICT evita errores si el mismo dispositivo se suscribe dos veces.
    await sql`
      INSERT INTO subscriptions (endpoint, p256dh, auth)
      VALUES (${endpoint}, ${keys.p256dh}, ${keys.auth})
      ON CONFLICT (endpoint) DO NOTHING;
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error guardando suscripción:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { endpoint } = await request.json();
    
    // Eliminamos la suscripción de Neon
    await sql`
      DELETE FROM subscriptions WHERE endpoint = ${endpoint};
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando suscripción:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
