import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es requerido' }, { status: 400 });
    }

    // 1. Obtener la URL de la imagen antes de borrar el registro
    const result = await sql`SELECT image_url FROM manifestations WHERE id = ${id}`;
    const manifestation = result.rows[0];

    // 2. Si hay imagen, intentar borrarla de Cloudinary
    if (manifestation && manifestation.image_url && manifestation.image_url.includes('cloudinary.com')) {
      const imageUrl = manifestation.image_url;
      // Extraer el public_id de la URL usando una expresión regular
      // Ejemplo: https://res.cloudinary.com/.../upload/v12345/mi_imagen.jpg -> mi_imagen
      const matches = imageUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
      
      if (matches && matches[1]) {
        const publicId = matches[1];
        
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (cloudName && apiKey && apiSecret) {
          const timestamp = Math.round(new Date().getTime() / 1000);
          
          // Generar la firma (signature) requerida por Cloudinary usando SHA-1
          const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
          const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

          const formData = new FormData();
          formData.append('public_id', publicId);
          formData.append('api_key', apiKey);
          formData.append('timestamp', timestamp);
          formData.append('signature', signature);

          // Llamada asíncrona a Cloudinary para destruir la imagen
          await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: 'POST',
            body: formData
          });
        } else {
          console.warn('Faltan credenciales de Cloudinary (API_KEY/API_SECRET) en el .env');
        }
      }
    }

    // 3. Borrar finalmente el registro de la base de datos de Neon
    await sql`DELETE FROM manifestations WHERE id = ${id}`;
    return NextResponse.json({ success: true, message: 'Manifestación soltada al universo (eliminada)' });
  } catch (error) {
    console.error('Error eliminando manifestación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}