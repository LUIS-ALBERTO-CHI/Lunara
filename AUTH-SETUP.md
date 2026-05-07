# 🌟 Configuración de Autenticación y Base de Datos

## Paso 1: Ejecutar el Script SQL en Neon

1. Ve a tu consola de Neon (https://console.neon.tech)
2. Selecciona tu proyecto y abre el SQL Editor
3. Copia y pega el contenido de `scripts/init-db.sql`
4. Ejecuta el script

Esto creará las tablas necesarias:
- `users` - Almacena email y contraseña hasheada
- `profiles` - Guarda la foto de perfil de cada usuario
- `subscriptions` - Tus suscripciones push

## Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará `bcryptjs` que necesitamos para hashear contraseñas de forma segura.

## Paso 3: Usar la Autenticación

### Flujo de Autenticación:

1. **Login/Signup**: Haz clic en "Iniciar Sesión" en la barra superior
2. **Foto de Perfil**: Si estás autenticado, haz clic en tu foto para cambiarla
3. **Logout**: Haz clic en el botón de salir (flecha)

### Características:

✅ **Seguridad**: Las contraseñas se hashean con bcryptjs  
✅ **Sesiones**: Se guardan en cookies seguras  
✅ **Foto de Perfil**: Se almacena en base64 en Neon  
✅ **Persistencia**: La sesión persiste aunque recargues la página  

## Endpoints Disponibles:

- `POST /api/auth/signup` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/profile-photo` - Actualizar foto de perfil
- `POST /api/auth/logout` - Cerrar sesión

## Flujo de Datos:

```
Usuario → AuthModal (signup/login) → API → Base de Datos (Neon)
                ↓
        Cookie de sesión (userId)
                ↓
        Foto de perfil guardada en profiles table
```

## Notas de Seguridad:

- Las cookies tienen `httpOnly: true` (no accesibles desde JS)
- Las cookies tienen `secure: true` en producción (solo HTTPS)
- Las contraseñas nunca se envían sin hashear

¡Listo! Tu PWA ahora tiene autenticación completa con gestor de fotos de perfil. 🚀
