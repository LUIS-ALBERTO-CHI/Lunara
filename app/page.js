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

  useEffect(() => {
    // Registrar el Service Worker al cargar la página
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error(err));
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
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Vighnaharta</h1>
      <p>Instala la aplicación desde la barra de direcciones de tu navegador.</p>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={subscribeUser} 
          disabled={isSubscribed}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          {isSubscribed ? 'Ya estás suscrito' : 'Suscribirse a Notificaciones'}
        </button>
        
        <button 
          onClick={sendTestPush}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'black', color: 'white' }}
        >
          Enviar Test a Todos
        </button>
      </div>
    </main>
  );
}
