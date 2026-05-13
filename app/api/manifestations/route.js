import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    let result;
    if (userEmail) {
      result = await sql`SELECT * FROM manifestations WHERE user_email = ${userEmail} ORDER BY created_at DESC LIMIT 15`;
    } else {
      // Para usuarios que no han iniciado sesión
      result = await sql`SELECT * FROM manifestations WHERE user_email = 'anonymous' ORDER BY created_at DESC LIMIT 15`;
    }

    return NextResponse.json({ manifestations: result.rows });
  } catch (error) {
    console.error('Error obteniendo manifestaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { intention, vision, energy, userEmail, imageUrl } = body;

    if (!intention) {
      return NextResponse.json({ error: 'La intención es requerida' }, { status: 400 });
    }

    // Guardar en la base de datos de Neon
    await sql`
      INSERT INTO manifestations (user_email, intention, vision, energy, image_url)
      VALUES (${userEmail || 'anonymous'}, ${intention}, ${vision}, ${energy}, ${imageUrl || null})
    `;

    return NextResponse.json({ success: true, message: 'Manifestación guardada con éxito' });
  } catch (error) {
    console.error('Error guardando manifestación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}