import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ success: false });
    }

    const response = NextResponse.json({ success: true });

    // Limpiar cookie de sesión
    response.cookies.delete('userId');

    return response;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
