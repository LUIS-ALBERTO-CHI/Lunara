import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { intention, vision, energy, userEmail } = body;

    if (!intention) {
      return NextResponse.json({ error: 'La intención es requerida' }, { status: 400 });
    }

    // Guardar en la base de datos de Neon
    await sql`
      INSERT INTO manifestations (user_email, intention, vision, energy)
      VALUES (${userEmail || 'anonymous'}, ${intention}, ${vision}, ${energy})
    `;

    return NextResponse.json({ success: true, message: 'Manifestación guardada con éxito' });
  } catch (error) {
    console.error('Error guardando manifestación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}