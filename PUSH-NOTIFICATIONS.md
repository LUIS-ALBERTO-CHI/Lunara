# 📬 Configuración de Notificaciones Push

## Descripción
Este sistema envía notificaciones push a los usuarios suscritos cuando hay un nuevo ritual cósmico disponible.

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```env
# Claves VAPID (generadas con web-push)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui

# Email de contacto para notificaciones de error de web-push
VAPID_SUBJECT=mailto:tu-email@example.com

# Token secreto para disparar notificaciones
RITUAL_NOTIFICATION_SECRET=tu-token-secreto-seguro-aqui

# URL base de tu aplicación
NEXTAUTH_URL=http://localhost:3000
```

## Generar Claves VAPID

Si no tienes claves VAPID, genéralas localmente con:

```bash
npx web-push generate-vapid-keys
```

Esto generará algo como:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB2Bq1bQ5zX0-9T2w-0cRtzM0
Private Key: vJklrQTZc_r-XjEd0oCEi...
```

## Endpoints Disponibles

### 1. GET `/api/send-daily-ritual`
Obtiene el ritual diario sin enviar notificaciones.

**Respuesta:**
```json
{
  "ritual": "Texto del ritual en español"
}
```

### 2. POST `/api/send-daily-ritual`
Obtiene un nuevo ritual y lo envía como notificación push a todos los suscriptores.

**Respuesta:**
```json
{
  "success": true,
  "ritual": "Texto del ritual",
  "sentTo": 5,
  "total": 10,
  "results": [
    { "success": true, "endpoint": "..." },
    { "success": false, "endpoint": "...", "error": "..." }
  ]
}
```

### 3. POST `/api/trigger-ritual-notification`
Dispara manualmente el envío de notificaciones con autenticación por token.

**Body:**
```json
{
  "secret": "tu-token-secreto-aqui"
}
```

**Respuesta:** Igual a POST `/api/send-daily-ritual`

## Configurar Envío Automático

### Opción 1: Cron Job Externo (Recomendado)
Usa un servicio como:
- **EasyCron.com**
- **AWS EventBridge**
- **Google Cloud Scheduler**
- **Vercel Crons** (si usas Vercel)

Configura un POST a:
```
https://tu-dominio.com/api/trigger-ritual-notification
Body: { "secret": "tu-token-secreto" }
```

### Opción 2: Next.js API Routes con Cron (Vercel)
Crea un archivo `/app/api/cron/send-ritual-notification/route.js`:

```javascript
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request) {
  // Verificar que es una llamada desde Vercel Crons
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/send-daily-ritual`, {
    method: 'POST'
  });

  return response;
}
```

Luego en `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-ritual-notification",
      "schedule": "0 6 * * *"
    }
  ]
}
```

## Flow de Suscripción/Desuscripción

1. **Suscripción**: El usuario activa el switch → se guarda en tabla `subscriptions`
2. **Notificación**: POST a `/api/send-daily-ritual` obtiene todas las suscripciones y envía
3. **Desuscripción**: El usuario desactiva el switch → se elimina de `subscriptions`
4. **Limpieza**: Si una suscripción devuelve 410 Gone, se elimina automáticamente

## Tabla de Base de Datos

```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing Local

```bash
# Obtener un ritual sin notificaciones
curl http://localhost:3000/api/send-daily-ritual

# Enviar notificaciones a todos los suscriptores
curl -X POST http://localhost:3000/api/send-daily-ritual

# Disparar con token (para testing)
curl -X POST http://localhost:3000/api/trigger-ritual-notification \
  -H "Content-Type: application/json" \
  -d '{"secret":"tu-token-secreto-aqui"}'
```

## Troubleshooting

**Error: "Invalid VAPID keys"**
- Verifica que las claves públicas y privadas estén correctas en `.env.local`

**Error: "Subscriptions not found"**
- Asegúrate de que la tabla `subscriptions` existe en Neon
- Verifica que `POSTGRES_URL` esté configurado

**Notificaciones no llegan**
- Comprueba que el Service Worker esté registrado correctamente
- Verifica permisos de notificaciones en el navegador
- Revisa la consola del navegador para errores

**Suscripción desaparece después de notificación**
- Esto ocurre si la suscripción es inválida (código 410 Gone)
- Es comportamiento normal, el usuario debe re-suscribirse
