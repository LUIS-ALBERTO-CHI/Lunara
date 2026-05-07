import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    // Buscar el usuario
    const result = await sql`
      SELECT id, email, password_hash FROM users WHERE email = ${email};
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Obtener perfil del usuario
    const profileResult = await sql`
      SELECT profile_photo_url FROM profiles WHERE user_id = ${user.id};
    `;

    const profile = profileResult.rows[0] || { profile_photo_url: null };

    // Crear respuesta con cookie de sesión
    const response = NextResponse.json(
      {
        success: true,
        userId: user.id,
        email: user.email,
        profilePhotoUrl: profile.profile_photo_url,
      },
      { status: 200 }
    );

    // Guardar sesión en cookie
    response.cookies.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
