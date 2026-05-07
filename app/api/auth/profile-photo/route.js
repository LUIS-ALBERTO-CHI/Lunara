import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { photoUrl } = await request.json();

    if (!photoUrl) {
      return NextResponse.json(
        { error: 'URL de foto requerida' },
        { status: 400 }
      );
    }

    // Actualizar foto de perfil
    const result = await sql`
      UPDATE profiles 
      SET profile_photo_url = ${photoUrl}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${parseInt(userId)}
      RETURNING user_id, profile_photo_url;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profilePhotoUrl: result.rows[0].profile_photo_url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error actualizando foto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
