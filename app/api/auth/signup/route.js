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

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Intentar crear el usuario
    const result = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hashedPassword})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    const user = result.rows[0];

    // Crear perfil vacío para el nuevo usuario
    await sql`
      INSERT INTO profiles (user_id, profile_photo_url)
      VALUES (${user.id}, NULL);
    `;

    // Crear respuesta con cookie de sesión
    const response = NextResponse.json(
      { success: true, userId: user.id, email: user.email },
      { status: 201 }
    );

    // Guardar sesión en cookie (simple, en producción usa sesiones seguras)
    response.cookies.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error) {
    console.error('Error en signup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
