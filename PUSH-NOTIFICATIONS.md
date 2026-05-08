# 📬 Configuración de Notificaciones Push

## Descripción
Este sistema envía notificaciones push a los usuarios suscritos cuando:
- ✨ Hay un nuevo **ritual cósmico** disponible
- 💫 Se actualiza la **afirmación del día** (6:30 AM)
- 🌙 Se crea una nueva **manifestación personalizada**

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

### 2.5. GET `/api/daily-affirmation`
Obtiene la afirmación del día sin enviar notificaciones.

**Respuesta:**
```json
{
  "affirmation": "Soy luz, soy paz, soy suficiente",
  "date": "8/5/2026"
}
```

### 2.6. POST `/api/daily-affirmation`
Obtiene la afirmación del día y la envía como notificación push a todos los suscriptores.

**Respuesta:**
```json
{
  "success": true,
  "affirmation": "Soy luz, soy paz, soy suficiente",
  "sentTo": 5,
  "total": 10,
  "date": "2026-05-08",
  "results": [
    { "success": true, "endpoint": "..." },
    { "success": false, "endpoint": "...", "error": "..." }
  ]
}
```

### 3. POST `/api/trigger-ritual-notification`
Dispara manualmente el envío de notificaciones con autenticación por token.

Soporta 3 tipos:

**Ritual:**
```json
{
  "secret": "tu-token-secreto-aqui",
  "type": "ritual"
}
```

**Afirmación del día:**
```json
{
  "secret": "tu-token-secreto-aqui",
  "type": "affirmation"
}
```

**Manifestación personalizada:**
```json
{
  "secret": "tu-token-secreto-aqui",
  "type": "manifestation",
  "message": "El universo conspira a mi favor ✨"
}
```

## Configurar Envío Automático

### Afirmación Diaria (6:30 AM - Recomendado)

Configura un cron job para enviar la afirmación del día a las 6:30 AM:

**EasyCron.com:**
```
https://tu-dominio.com/api/trigger-ritual-notification
Method: POST
Header: Content-Type: application/json
Body: { "secret": "tu-token-secreto", "type": "affirmation" }
Schedule: Daily at 06:30
```

**Vercel Crons (`vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/cron/send-affirmation",
      "schedule": "30 6 * * *"
    }
  ]
}
```

Crea `/app/api/cron/send-affirmation/route.js`:
```javascript
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/daily-affirmation`, {
    method: 'POST'
  });

  return response;
}
```

### Otros Cron Jobs

**Ritual Aleatorio (ejemplo: 7 AM):**
```bash
curl -X POST https://tu-dominio.com/api/trigger-ritual-notification \
  -H "Content-Type: application/json" \
  -d '{"secret":"tu-token-secreto", "type":"ritual"}'
```

**Cron Job Externo Personalizado:**
- **EasyCron.com**: Configura POST a `https://tu-dominio.com/api/trigger-ritual-notification`
- **AWS EventBridge**: Crea regla con destino Lambda → fetch a tu API
- **Google Cloud Scheduler**: Job con HTTP target

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
      "schedule": "0 7 * * *"
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
# ═══════════════════════════════════════════════════════════════
# 🌙 RITUALES
# ═══════════════════════════════════════════════════════════════

# Obtener un ritual sin notificaciones
curl http://localhost:3000/api/send-daily-ritual

# Enviar ritual aleatorio con notificaciones a suscriptores
curl -X POST http://localhost:3000/api/send-daily-ritual

# Disparar ritual con token
curl -X POST http://localhost:3000/api/trigger-ritual-notification \
  -H "Content-Type: application/json" \
  -d '{"secret":"9a2c097b209792b0ac2fe4f7d3697e6cea09ce77d666176e6493d31333790fde", "type":"ritual"}'

# ═══════════════════════════════════════════════════════════════
# 💫 AFIRMACIONES DIARIAS
# ═══════════════════════════════════════════════════════════════

# Obtener afirmación del día sin notificaciones
curl http://localhost:3000/api/daily-affirmation

# Enviar afirmación del día con notificaciones a suscriptores
curl -X POST http://localhost:3000/api/daily-affirmation

# Disparar afirmación con token (la que se debería enviar cada mañana)
curl -X POST http://localhost:3000/api/trigger-ritual-notification \
  -H "Content-Type: application/json" \
  -d '{"secret":"9a2c097b209792b0ac2fe4f7d3697e6cea09ce77d666176e6493d31333790fde", "type":"affirmation"}'

# ═══════════════════════════════════════════════════════════════
# 🌙 MANIFESTACIONES
# ═══════════════════════════════════════════════════════════════

# Disparar manifestación personalizada con token
curl -X POST http://localhost:3000/api/trigger-ritual-notification \
  -H "Content-Type: application/json" \
  -d '{"secret":"9a2c097b209792b0ac2fe4f7d3697e6cea09ce77d666176e6493d31333790fde", "type":"manifestation", "message":"El universo conspira a mi favor ✨"}'
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
