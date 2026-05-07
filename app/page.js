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
  const [affirmation, setAffirmation] = useState('Cargando tu afirmación del día...');
  const [isLoadingAffirmation, setIsLoadingAffirmation] = useState(true);
  
  useEffect(() => {
    // Obtener la afirmación del día desde localStorage o la API
    const fetchAffirmation = async () => {
      try {
        const now = new Date();
        const updateHour = 6; // 6:30 AM
        const updateMinute = 30;
        
        // Obtener datos guardados en localStorage
        const stored = localStorage.getItem('affirmationData');
        const storedData = stored ? JSON.parse(stored) : null;
        
        // Calcular si es hora de actualizar (después de las 6:30 AM)
        const isUpdateTime = now.getHours() > updateHour || 
                            (now.getHours() === updateHour && now.getMinutes() >= updateMinute);
        
        // Obtener la fecha actual en formato YYYY-MM-DD
        const today = now.toISOString().split('T')[0];
        
        // Verificar si tenemos una afirmación válida del mismo día
        if (storedData && storedData.date === today && isUpdateTime === false) {
          // Usar la afirmación guardada (todavía no es hora de actualizar)
          setAffirmation(storedData.affirmation);
        } else if (storedData && storedData.date === today && storedData.lastUpdate === 'done') {
          // Ya se actualizó hoy después de las 6:30 AM
          setAffirmation(storedData.affirmation);
        } else if (isUpdateTime) {
          // Es hora de obtener una nueva afirmación
          const res = await fetch('/api/daily-affirmation');
          const data = await res.json();
          setAffirmation(data.affirmation);
          
          // Guardar la nueva afirmación con marca de actualización
          localStorage.setItem('affirmationData', JSON.stringify({
            affirmation: data.affirmation,
            date: today,
            lastUpdate: 'done'
          }));
        } else {
          // Primer acceso del día, antes de las 6:30 AM
          const res = await fetch('/api/daily-affirmation');
          const data = await res.json();
          setAffirmation(data.affirmation);
          
          localStorage.setItem('affirmationData', JSON.stringify({
            affirmation: data.affirmation,
            date: today,
            lastUpdate: 'pending'
          }));
        }
      } catch (error) {
        console.error('Error al obtener afirmación:', error);
        setAffirmation('Soy luz, soy paz, soy suficiente');
      } finally {
        setIsLoadingAffirmation(false);
      }
    };

    fetchAffirmation();

    // Configurar intervalo para verificar cada hora si es hora de actualizar
    const interval = setInterval(() => {
      const now = new Date();
      const updateHour = 6;
      const updateMinute = 30;
      
      if (now.getHours() === updateHour && now.getMinutes() >= updateMinute && now.getMinutes() < updateMinute + 1) {
        // Ejecutar la actualización cuando sea exactamente 6:30 AM
        fetchAffirmation();
      }
    }, 60000); // Verificar cada minuto

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

    return () => clearInterval(interval);
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
    <>
      {/* TopAppBar */}
      <header className="bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-2xl text-primary dark:text-primary-fixed-dim docked full-width top-0 sticky z-50 border-b border-white/20 dark:border-outline/10 shadow-[0_4px_30px_rgba(114,84,119,0.1)] flex justify-between items-center px-gutter w-full h-16">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-primary"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>
          <span className="font-h2 text-h2 italic text-primary dark:text-primary-fixed">Positiva</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container hover:opacity-80 transition-opacity cursor-pointer">
            <img alt="Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHDOSBWkvpx78HLD_S93nD8kYo8mBLnZ2viPi8EYEwLnH9h7cAMtB_kfYXvax2MksGpvJ4HgdHUh40DHMddcA8TojeoQUod2rDuL_ZNFp0UGpMNDtQJU9TMyKkQSsjqEJcFx3I1KQQo-bGvN-NHnZbbr-_1anACp9B4AvjfpqegrHE7GTSXxzUQvJ9fmSxOCVyeYB1j-lY_1n0CNkO-HzbLnlevIWWCsaEt1Zi2lv6kRoADRwXo_L5dBRxx0LB-zEW8Isv4gOW2wY"/>
          </div>
        </div>
      </header>
      
      <main className="relative px-gutter pb-32 pt-8 max-w-lg mx-auto min-h-[calc(100vh-64px)] overflow-hidden">
        {/* Decorative Clouds and Stars */}
        <div className="absolute top-20 -left-10 w-40 h-40 bg-primary-fixed/30 blur-3xl rounded-full -z-10"></div>
        <div className="absolute bottom-40 -right-10 w-60 h-60 bg-secondary-fixed/30 blur-3xl rounded-full -z-10"></div>
        
        {/* Affirmation Card */}
        <section className="mb-section-gap relative z-10">
          <div className="glass p-container-padding rounded-lg shadow-[0_10px_40px_rgba(114,84,119,0.1)] border-t border-l border-white/60">
            <div className="flex flex-col items-center text-center space-y-3">
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase">Afirmación del Día</span>
              <h2 className={`font-h2 text-h2 text-on-surface-variant italic transition-opacity ${isLoadingAffirmation ? 'opacity-60' : 'opacity-100'}`}>
                "{affirmation}"
              </h2>
              <div className="flex gap-2">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-primary/40"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-primary/40"><path d="M12 2a10 10 0 1 0 10 10 7 7 0 0 1-10-10z"/></svg>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-primary/40"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>
              </div>
            </div>
          </div>
        </section>

        {/* Companion Section */}
        <section className="flex flex-col items-center justify-center py-unit relative h-80">
          <div className="organic-float relative">
            <div className="absolute inset-0 bg-primary-container/40 blur-2xl rounded-full scale-150 -z-10"></div>
            <div className="w-56 h-56 rounded-full overflow-hidden celestial-glow border-4 border-white/80 p-2 glass">
              <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-tr from-primary-container to-tertiary-container">
                <img alt="Compañero Místico" className="w-full h-full object-cover mix-blend-soft-light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqcZiUmuW2INfy-hrCRyWIBmHED266Ex3ydzMcymrDhW-xQY9jzdiBedZdeRE4-VGH8lmmRX-fgcTVA3gJD34aRm_MpFgpHF8TX-9VXWY_4p9yhnuo18lOpdLkZhzQDgMjOsoqwHe6shCr0YYWMoPSpijdYoqyOjAPn_Ao7HpArCsOv6L7pbLueHOZcyVxoePihL9aAOytn7aYOIiDUWMRTC4icOHgPnrGjY90y5qkiTbdQcYDb4PY0DDCQ6XJkEp71G9RkpoST6U"/>
              </div>
            </div>
            <div className="absolute -top-4 -right-2 text-primary-container animate-pulse">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10 7 7 0 0 1-10-10z"/></svg>
            </div>
            <div className="absolute -bottom-2 -left-4 text-secondary-container">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          </div>
          <div className="mt-8 text-center">
            <h3 className="font-h3 text-h3 text-primary">Tu Universo está en calma</h3>
            <p className="font-body-md text-on-surface-variant opacity-80 mt-1">Alma Estelar, tu energía vibra hoy en 980 Hz</p>
          </div>
        </section>

        {/* Quick Actions Bento Grid */}
        <section className="mt-section-gap grid grid-cols-2 gap-4">
          <button onClick={subscribeUser} disabled={isSubscribed} className="glass p-container-padding rounded-lg flex flex-col items-center gap-3 hover:scale-105 transition-all group active:scale-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2v8M4.22 10.22l1.42 1.42M1 18h22M22.78 10.22l-1.42 1.42M8 22h8M12 10a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z"/></svg>
            </div>
            <span className="font-label-sm text-label-sm text-primary-fixed-variant">{isSubscribed ? 'Ritual Activo ✅' : 'Ritual de Mañana'}</span>
          </button>
          <button onClick={sendTestPush} className="glass p-container-padding rounded-lg flex flex-col items-center gap-3 hover:scale-105 transition-all group active:scale-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span className="font-label-sm text-label-sm text-on-secondary-fixed-variant">Meditación Flash</span>
          </button>
        </section>

        {/* Insights / Mini Cards */}
        <section className="mt-gutter space-y-4">
          <div className="glass p-gutter rounded-lg flex items-center gap-4">
            <div className="w-10 h-10 bg-tertiary-container/30 rounded-full flex items-center justify-center text-tertiary">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">Luna Actual</p>
              <p className="font-body-md text-on-surface">Creciente en Libra</p>
            </div>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="text-primary/30"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </section>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-6 left-0 right-0 flex justify-around items-center h-20 z-50 px-4 mx-auto max-w-md bg-white/40 dark:bg-surface-container-highest/40 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_10px_40px_rgba(114,84,119,0.25)] rounded-full w-[92%]">
        <a className="flex flex-col items-center justify-center bg-gradient-to-br from-primary-container to-tertiary-container text-on-primary-container rounded-full px-4 py-2 scale-110 transition-transform animate-pulse duration-[2000ms]" href="#">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span className="font-label-sm text-label-sm tracking-widest mt-1">Universo</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-secondary-fixed-variant dark:text-on-secondary-fixed opacity-70 hover:scale-105 transition-all" href="#">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2.5 21.5l14-14M22 2l-2 2M22 6l-2-2M18 2l2 2M2 6l2-2M2 2l2 2M6 2l-2 2"/></svg>
          <span className="font-label-sm text-label-sm tracking-widest mt-1">Manifestar</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-secondary-fixed-variant dark:text-on-secondary-fixed opacity-70 hover:scale-105 transition-all" href="#">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span className="font-label-sm text-label-sm tracking-widest mt-1">Diario</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-secondary-fixed-variant dark:text-on-secondary-fixed opacity-70 hover:scale-105 transition-all" href="#">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span className="font-label-sm text-label-sm tracking-widest mt-1">Oráculo</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-secondary-fixed-variant dark:text-on-secondary-fixed opacity-70 hover:scale-105 transition-all" href="#">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span className="font-label-sm text-label-sm tracking-widest mt-1">Guía</span>
        </a>
      </nav>
    </>
  );
}
