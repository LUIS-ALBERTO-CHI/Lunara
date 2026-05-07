'use client';

import { useEffect, useState } from 'react';

// Utilidad necesaria para convertir la llave pública al formato que pide el navegador
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Home() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Estados para el Splash Screen
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Simulamos el tiempo de carga de la app (1.5 segundos)
    const splashTimer = setTimeout(() => {
      setIsFading(true);
      // Esperamos que termine la transición de CSS (0.5s) para removerlo del DOM
      setTimeout(() => setShowSplash(false), 500);
    }, 1500);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    // Registrar el Service Worker al cargar la página
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Opcional: Aquí podrías mostrar un aviso si hay actualización
        reg.addEventListener('updatefound', () => {
          console.log('Descargando nueva versión de la PWA de fondo...');
        });
      }).catch(err => console.error('Error al registrar SW:', err));

      // Cuando el nuevo Service Worker toma el control, recargamos la app
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const subscribeUser = async () => {
    try {
      // Pedimos permiso explícitamente al usuario
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Debes aceptar los permisos para recibir notificaciones.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Suscribimos el dispositivo a los servicios de push del navegador (ej. Chrome, Safari)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      // Enviamos el objeto de suscripción a nuestra API para guardarlo en Neon
      await fetch('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' },
      });

      setIsSubscribed(true);
      alert('¡Suscrito correctamente!');
    } catch (error) {
      console.error('Error al suscribir:', error);
      alert('El usuario bloqueó las notificaciones o hubo un error.');
    }
  };

  const sendTestPush = async () => {
    const res = await fetch('/api/send-test', { method: 'POST' });
    const data = await res.json();
    alert(`Notificaciones enviadas a ${data.count} dispositivo(s).`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* Splash Screen (Pantalla de Carga Inicial) */}
      {showSplash && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'var(--primary)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          opacity: isFading ? 0 : 1,
          transition: 'opacity 0.5s ease-out'
        }}>
          <img 
            src="/icon-192x192.png" 
            alt="Vighnaharta Logo" 
            style={{ 
              width: '120px', 
              height: '120px', 
              marginBottom: '20px'
            }} 
          />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Vighnaharta</h1>
        </div>
      )}
      
      {/* Header fijo superior */}
      <header style={{ 
        height: '60px', 
        backgroundColor: 'var(--primary)', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'fixed',
        top: 0, width: '100%', zIndex: 10
      }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Vighnaharta</h1>
      </header>

      {/* Contenedor principal de la página */}
      <main style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '80px 20px 80px 20px', /* Espacio para el header y footer */
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        maxWidth: '600px', /* En PC no se verá gigante */
        margin: '0 auto',
        width: '100%'
      }}>
        
        {/* Tarjeta de Notificaciones */}
        <div style={{ 
          backgroundColor: 'var(--surface)', 
          padding: '20px', 
          borderRadius: '16px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Notificaciones Push</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
            Activa las notificaciones para recibir alertas y mantenerte actualizado con las novedades de la aplicación.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={subscribeUser} 
              disabled={isSubscribed}
              style={{ 
                padding: '12px', 
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isSubscribed ? '#D1D5DB' : 'var(--primary)',
                color: isSubscribed ? '#6B7280' : 'white',
                fontWeight: 'bold',
                cursor: isSubscribed ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {isSubscribed ? 'Notificaciones Activadas ✅' : 'Activar Notificaciones'}
            </button>
            
            <button 
              onClick={sendTestPush}
              style={{ 
                padding: '12px', 
                borderRadius: '8px',
                border: '1px solid var(--primary)',
                backgroundColor: 'transparent', 
                color: 'var(--primary)',
                fontWeight: 'bold',
                cursor: 'pointer' 
              }}
            >
              Enviar Test a Todos
            </button>
          </div>
        </div>

      </main>

      {/* Barra de Navegación Inferior (Bottom Nav) */}
      <nav style={{ 
        height: '65px', 
        backgroundColor: 'var(--surface)', 
        borderTop: '1px solid #E5E7EB',
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        position: 'fixed',
        bottom: 0, width: '100%', zIndex: 10,
        paddingBottom: 'env(safe-area-inset-bottom)', /* Soporte para el área del iPhone */
        color: 'var(--text-muted)'
      }}>
        
        {/* Icono Inicio */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'var(--primary)' }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: 'bold' }}>Inicio</span>
        </div>

        {/* Icono Notificaciones */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Alertas</span>
        </div>

        {/* Icono Perfil */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Perfil</span>
        </div>
      </nav>
    </div>
  );
}
