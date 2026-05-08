'use client';

import { useEffect, useState, useRef } from 'react';
import AuthModal from './components/AuthModal';
import PhotoUploadModal from './components/PhotoUploadModal';

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
  const [user, setUser] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [energyData, setEnergyData] = useState({
    title: 'Cargando tu energía...',
    message: 'Sintonizando con el universo...'
  });
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(true);
  const [canRequestRitual, setCanRequestRitual] = useState(true);
  const [showRitualModal, setShowRitualModal] = useState(false);
  const [ritualContent, setRitualContent] = useState('');
  const [isLoadingRitual, setIsLoadingRitual] = useState(false);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [meditationTimeLeft, setMeditationTimeLeft] = useState(60);
  const [isMeditating, setIsMeditating] = useState(false);
  const [breathAction, setBreathAction] = useState('Respira profundo');
  const [astroData, setAstroData] = useState({
    phase: 'Sintonizando astros...',
    illumination: '--',
    sign: '...',
    moonrise: '--',
    moonset: '--'
  });
  const [activeTab, setActiveTab] = useState('universo');
  const audioRef = useRef(null);
  
  useEffect(() => {
    // Restaurar sesión de usuario al recargar la página o abrir la app
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        if (userData.profilePhotoUrl) {
          setProfilePhoto(userData.profilePhotoUrl);
        }
      } catch (error) {
        console.error('Error al restaurar sesión de usuario:', error);
      }
    }

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

    // Obtener la energía diaria dinámica
    const fetchEnergy = async () => {
      try {
        const res = await fetch('/api/daily-energy');
        const data = await res.json();
        if (data.title && data.message) {
          setEnergyData({ title: data.title, message: data.message });
        }
      } catch (error) {
        console.error('Error al obtener energía:', error);
        setEnergyData({ title: 'Tu Universo está en calma', message: 'Alma Estelar, tu energía vibra hoy en 980 Hz' });
      } finally {
        setIsLoadingEnergy(false);
      }
    };
    fetchEnergy();

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

      // Comprobar si ya estamos suscritos al cargar la app
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
        });
      });
    }

    // Comprobar si ya se pidió el ritual en las últimas 24 horas al cargar la página
    const lastRitual = localStorage.getItem('lastRitualTime');
    if (lastRitual && (new Date().getTime() - parseInt(lastRitual)) < 86400000) {
      setCanRequestRitual(false);
    }

    // Obtener información astrológica detallada (AstroApi)
    const fetchAstroData = async () => {
      try {
        const res = await fetch('/api/astro-info');
        const contentType = res.headers.get("content-type");

        // Verificamos que la respuesta sea correcta y que realmente sea un JSON
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.phase) setAstroData(data);
        } else {
          // Fallback si la ruta no existe o devuelve un HTML de error (404)
          setAstroData({
            phase: 'Creciente', illumination: '65%', sign: 'Libra', moonrise: '18:30', moonset: '06:15'
          });
        }
      } catch (error) {
        console.error('Error al obtener datos astrológicos:', error);
        setAstroData({
          phase: 'Creciente', illumination: '65%', sign: 'Libra', moonrise: '18:30', moonset: '06:15'
        });
      }
    };
    fetchAstroData();

    return () => clearInterval(interval);
  }, []);

  // Efecto para manejar el temporizador de la meditación y las fases de respiración
  useEffect(() => {
    let interval;
    if (isMeditating && meditationTimeLeft > 0) {
      interval = setInterval(() => {
        setMeditationTimeLeft((prev) => {
          const newTime = prev - 1;
          // Ciclo de 8 segundos (4s Inhala, 4s Exhala)
          if (newTime % 8 >= 4) setBreathAction('Inhala...');
          else setBreathAction('Exhala...');
          return newTime;
        });
      }, 1000);
    } else if (meditationTimeLeft === 0 && isMeditating) {
      setBreathAction('¡Completado!');
      setIsMeditating(false);
      // Pausar el audio suavemente al terminar
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    return () => clearInterval(interval);
  }, [isMeditating, meditationTimeLeft]);

  const handleMorningRitual = async () => {
    const lastRitualTime = localStorage.getItem('lastRitualTime');
    const savedRitual = localStorage.getItem('savedRitual');
    const now = new Date().getTime();

    // Si ya hay un ritual guardado y no han pasado 24h
    if (lastRitualTime && savedRitual && (now - parseInt(lastRitualTime)) < 86400000) {
      setRitualContent(savedRitual);
      setShowRitualModal(true);
      return;
    }

    // Si es nuevo, abrimos el modal en estado de carga
    setIsLoadingRitual(true);
    setShowRitualModal(true);

    try {
      const res = await fetch('/api/send-daily-ritual');
      const contentType = res.headers.get("content-type");

      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        const ritual = data.ritual || "Respira profundo y agradece por un nuevo día.";
        
        setRitualContent(ritual);
        localStorage.setItem('lastRitualTime', now.toString());
        localStorage.setItem('savedRitual', ritual);
        setCanRequestRitual(false);
      } else {
        // Si recibimos HTML o un error del servidor, usamos un mensaje por defecto
        setRitualContent("Respira profundo y agradece por un nuevo día. El universo te guía.");
        localStorage.setItem('lastRitualTime', now.toString());
        localStorage.setItem('savedRitual', "Respira profundo y agradece por un nuevo día. El universo te guía.");
        setCanRequestRitual(false);
      }
    } catch (error) {
      console.error('Error obteniendo el ritual:', error);
      setRitualContent('Hubo un desequilibrio cósmico. Inténtalo de nuevo.');
    } finally {
      setIsLoadingRitual(false);
    }
  };

  const handleOpenMeditation = () => {
    setShowMeditationModal(true);
    setMeditationTimeLeft(60); // 1 minuto
    setIsMeditating(false);
    setBreathAction('Respira profundo');
    
    // Inicializar el audio si no existe
    if (!audioRef.current) {
      // Sonido relajante público de olas suaves
      audioRef.current = new Audio('https://actions.google.com/sounds/v1/water/ocean_waves_pebble_beach.ogg');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4; // Volumen suave al 40%
    }
  };

  const startMeditation = () => {
    setIsMeditating(true);
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('El navegador bloqueó el autoplay:', err));
    }
  };

  const closeMeditation = () => {
    setShowMeditationModal(false);
    setIsMeditating(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reiniciar el audio al principio
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    if (userData.profilePhotoUrl) {
      setProfilePhoto(userData.profilePhotoUrl);
    }
    // Guardar datos en localStorage para persistencia
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handlePhotoUpdate = (photoUrl) => {
    setProfilePhoto(photoUrl);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setProfilePhoto(null);
    localStorage.removeItem('user');
  };

  const handleToggleNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Las notificaciones push no están soportadas en tu navegador.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (isSubscribed) {
        // Desuscribirse
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Avisar a la base de datos (Neon) para borrar esta suscripción
          await fetch('/api/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
          });
          
          await subscription.unsubscribe();
        }
        setIsSubscribed(false);
      } else {
        // Pedir permiso y suscribirse
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Necesitamos tu permiso para enviarte magia cósmica.');
          return;
        }
        
        // Obtiene tu llave pública desde las variables de entorno
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB2Bq1bQ5zX0-9T2w-0cRtzM0';
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        
        // Enviar 'subscription' a tu backend para guardarla en la tabla 'subscriptions'
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: subscription.toJSON().keys
          })
        });
        
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Error con las notificaciones:', error);
      alert('Hubo un desequilibrio al configurar las notificaciones.');
    }
  };

  return (
    <>
      {/* TopAppBar */}
      <header className="relative bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-2xl text-primary dark:text-primary-fixed-dim docked full-width top-0 sticky z-50 border-b border-white/20 dark:border-outline/10 shadow-[0_4px_30px_rgba(114,84,119,0.1)] flex justify-between items-center px-3 sm:px-gutter w-full h-14 sm:h-16">
        
        {/* Lado Izquierdo: Perfil y Logout / Auth */}
        <div className="flex items-center z-10">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPhotoModal(true)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img
                  alt="Profile"
                  className="w-full h-full object-cover"
                  src={profilePhoto || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHDOSBWkvpx78HLD_S93nD8kYo8mBLnZ2viPi8EYEwLnH9h7cAMtB_kfYXvax2MksGpvJ4HgdHUh40DHMddcA8TojeoQUod2rDuL_ZNFp0UGpMNDtQJU9TMyKkQSsjqEJcFx3I1KQQo-bGvN-NHnZbbr-_1anACp9B4AvjfpqegrHE7GTSXxzUQvJ9fmSxOCVyeYB1j-lY_1n0CNkO-HzbLnlevIWWCsaEt1Zi2lv6kRoADRwXo_L5dBRxx0LB-zEW8Isv4gOW2wY'}
                />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-1.5 sm:py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs sm:text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              Iniciar Sesión
            </button>
          )}
        </div>

        {/* Centro: Título de la App */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 z-0">
          <span className="font-semibold text-base sm:text-lg italic text-primary dark:text-primary-fixed">Vighnaharta</span>
        </div>

        {/* Lado Derecho: Configuraciones (Settings) */}
        <div className="flex items-center z-10">
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${showSettings ? 'bg-primary/20 text-primary' : 'text-primary/80 hover:text-primary hover:bg-primary/10'}`} 
            title="Ajustes"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
          </button>
        </div>

        {/* Panel de Ajustes (Dropdown) */}
        {showSettings && (
          <div className="absolute top-[60px] sm:top-16 right-3 sm:right-gutter w-64 bg-surface/95 dark:bg-surface-dim/95 backdrop-blur-xl border border-white/40 dark:border-outline/10 shadow-[0_15px_40px_rgba(114,84,119,0.2)] rounded-2xl p-5 flex flex-col gap-4 z-50">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mb-1">
              <h3 className="text-lg font-h3 font-semibold text-primary">Ajustes</h3>
              <button onClick={() => setShowSettings(false)} className="text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {/* Toggle de Notificaciones */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-on-surface">Notificaciones</span>
                <span className="text-[10px] text-on-surface-variant opacity-70">Rituales y energía</span>
              </div>
              <button 
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${isSubscribed ? 'bg-primary' : 'bg-surface-variant/70'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isSubscribed ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Botón de Cerrar Sesión */}
            {user && (
              <button 
                onClick={() => {
                  handleLogout();
                  setShowSettings(false);
                }} 
                className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 bg-error/10 text-error hover:bg-error/20 rounded-xl text-sm font-semibold transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Cerrar Sesión
              </button>
            )}
          </div>
        )}
      </header>
      
      <main className="relative px-3 sm:px-gutter pb-24 sm:pb-32 pt-4 sm:pt-8 max-w-lg mx-auto min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] overflow-hidden">
        {/* Decorative Clouds and Stars */}
        <div className="absolute top-10 sm:top-20 -left-20 sm:-left-10 w-32 sm:w-40 h-32 sm:h-40 bg-primary-fixed/30 blur-3xl rounded-full -z-10"></div>
        <div className="absolute bottom-32 sm:bottom-40 -right-20 sm:-right-10 w-40 sm:w-60 h-40 sm:h-60 bg-secondary-fixed/30 blur-3xl rounded-full -z-10"></div>
        
        {/* Affirmation Card */}
        <section className="mb-4 sm:mb-section-gap relative z-10">
          <div className="glass p-4 sm:p-container-padding rounded-lg shadow-[0_10px_40px_rgba(114,84,119,0.1)] border-t border-l border-white/60">
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
              <span className="text-xs sm:text-sm text-primary tracking-widest uppercase font-semibold">Afirmación del Día</span>
              <h2 className={`text-base sm:text-2xl text-on-surface-variant italic transition-opacity font-semibold leading-relaxed ${isLoadingAffirmation ? 'opacity-60' : 'opacity-100'}`}>
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
        <section className="flex flex-col items-center justify-center py-4 sm:py-unit relative h-60 sm:h-80">
          <div className="organic-float relative">
            <div className="absolute inset-0 bg-primary-container/40 blur-2xl rounded-full scale-150 -z-10"></div>
            <div className="w-40 sm:w-56 h-40 sm:h-56 rounded-full overflow-hidden celestial-glow border-4 border-white/80 p-2 glass">
              <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-tr from-primary-container to-tertiary-container">
                <img alt="Pequeño elefante místico" className="w-full h-full object-cover mix-blend-soft-light" data-alt="A cute, mystical baby elephant (Ganesha-inspired) in a soft, ethereal pastel style. The elephant should have a pearlescent lavender skin tone, a tiny golden lotus crown, and be surrounded by a magical aura of sparkles and soft cosmic dust." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNfcVTTuz2eKs5PA4qZxqwwfLnsSGwPCB_gsn3EC3Tajm2XObyDuOo_blqgntSc_32Xkg4WzDI0MuBvgHw3ltDBK7okZk0RAMzpYs8_eE-0MhajJAhIbYCtCD9DlSPLpXT2YqVJ4u8J4lyTmE_Asr13sL4z4m9ze8o5h4-UXUg5JV70mVPPR3oTKvU7k2xJZnSFtV39IDR_K1CmC15E9DlGI6l3uM61sk_LGsl_iWUZZ70nDeZUsHsmfyGWjqR7yobc2wz8vAP7YI" />
              </div>
            </div>
            <div className="absolute -top-4 -right-2 text-primary-container animate-pulse">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10 7 7 0 0 1-10-10z"/></svg>
            </div>
            <div className="absolute -bottom-2 -left-4 text-secondary-container">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          </div>
          <div className="mt-4 sm:mt-8 text-center">
        <h3 className={`text-lg sm:text-2xl text-primary font-bold transition-opacity duration-500 ${isLoadingEnergy ? 'opacity-60' : 'opacity-100'}`}>
          {energyData.title}
        </h3>
        <p className={`text-xs sm:text-sm text-on-surface-variant opacity-80 mt-1 transition-opacity duration-500 ${isLoadingEnergy ? 'opacity-60' : 'opacity-100'}`}>
          {energyData.message}
        </p>
          </div>
        </section>

        {/* Quick Actions Bento Grid */}
        <section className="mt-4 sm:mt-section-gap grid grid-cols-2 gap-2 sm:gap-4">
          <button onClick={handleMorningRitual} className="glass p-3 sm:p-container-padding rounded-lg flex flex-col items-center gap-2 sm:gap-3 transition-all duration-200 hover:scale-105 active:scale-95 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <svg width="18" height="18" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2v8M4.22 10.22l1.42 1.42M1 18h22M22.78 10.22l-1.42 1.42M8 22h8M12 10a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z"/></svg>
            </div>
            <span className="text-xs sm:text-sm text-primary-fixed-variant font-semibold">{!canRequestRitual ? 'Ver Ritual de Hoy' : 'Ritual de Mañana'}</span>
          </button>
          <button onClick={handleOpenMeditation} className="glass p-3 sm:p-container-padding rounded-lg flex flex-col items-center gap-2 sm:gap-3 hover:scale-105 transition-all group active:scale-95 duration-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
              <svg width="18" height="18" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span className="text-xs sm:text-sm text-on-secondary-fixed-variant font-semibold">Meditación Flash</span>
          </button>
        </section>

        {/* Astro Insights / Mini Cards */}
        <section className="mt-3 sm:mt-gutter grid grid-cols-2 gap-2 sm:gap-4 relative z-10">
          {/* Tarjeta Principal: Fase y Signo */}
          <div className="glass p-3 sm:p-4 rounded-lg flex items-center gap-3 sm:gap-4 col-span-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-tertiary-container/30 rounded-full flex items-center justify-center text-tertiary flex-shrink-0 border border-white/40">
              <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-on-surface-variant opacity-70 font-semibold uppercase tracking-widest">Luna en {astroData.sign}</p>
              <p className="text-sm sm:text-lg text-on-surface font-semibold truncate capitalize">{astroData.phase}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] sm:text-xs text-primary font-bold px-2 py-1 bg-primary-container/50 rounded-full border border-primary/10">{astroData.illumination} Luz</span>
            </div>
          </div>

          {/* Tarjeta: Amanecer Lunar */}
          <div className="glass p-3 sm:p-4 rounded-lg flex flex-col gap-1.5 items-start justify-center border border-white/30">
            <span className="text-[10px] sm:text-xs text-on-surface-variant opacity-70 font-bold uppercase tracking-wider">Amanecer Lunar</span>
            <div className="flex items-center gap-2 text-primary">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="M8 6l4-4 4 4"/><path d="M2 22h20"/></svg>
              <span className="text-sm sm:text-base font-semibold">{astroData.moonrise}</span>
            </div>
          </div>

          {/* Tarjeta: Ocaso Lunar */}
          <div className="glass p-3 sm:p-4 rounded-lg flex flex-col gap-1.5 items-start justify-center border border-white/30">
            <span className="text-[10px] sm:text-xs text-on-surface-variant opacity-70 font-bold uppercase tracking-wider">Ocaso Lunar</span>
            <div className="flex items-center gap-2 text-secondary">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-8"/><path d="M8 18l4 4 4-4"/><path d="M2 2h20"/></svg>
              <span className="text-sm sm:text-base font-semibold">{astroData.moonset}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        userId={user?.userId}
        onPhotoUpdate={handlePhotoUpdate}
      />

      {/* Ritual Modal */}
      {showRitualModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="glass rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-white/40 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed/50 blur-2xl rounded-full -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary-fixed/50 blur-2xl rounded-full -z-10"></div>
            
            <button onClick={() => setShowRitualModal(false)} className="absolute top-4 right-4 text-on-surface-variant/50 hover:text-on-surface transition-colors">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="w-14 h-14 bg-gradient-to-tr from-primary-container to-tertiary-container rounded-full flex items-center justify-center mx-auto mb-4 text-primary shadow-inner border border-white/50">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2v8M4.22 10.22l1.42 1.42M1 18h22M22.78 10.22l-1.42 1.42M8 22h8M12 10a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z"/></svg>
            </div>
            
            <h2 className="text-2xl font-bold text-primary mb-2 font-h2">Tu Ritual de Hoy</h2>
            <p className="text-xs text-on-surface-variant/70 uppercase tracking-widest font-semibold mb-6">Mensaje del Universo</p>

            {isLoadingRitual ? (
              <div className="animate-pulse space-y-3 mt-4 mb-8">
                <div className="h-4 bg-primary/20 rounded w-5/6 mx-auto"></div>
                <div className="h-4 bg-primary/20 rounded w-4/6 mx-auto"></div>
                <div className="h-4 bg-primary/20 rounded w-3/6 mx-auto"></div>
              </div>
            ) : (
              <p className="text-on-surface-variant text-base sm:text-lg italic leading-relaxed my-6 font-body-lg">
                "{ritualContent}"
              </p>
            )}
            
            <button onClick={() => setShowRitualModal(false)} className="w-full px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
              Agradecer y Continuar
            </button>
          </div>
        </div>
      )}

      {/* Meditation Modal */}
      {showMeditationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 transition-all">
          <div className="glass rounded-3xl p-8 sm:p-10 max-w-sm w-full shadow-2xl border border-white/30 text-center relative overflow-hidden flex flex-col items-center">
            <button onClick={closeMeditation} className="absolute top-4 right-4 text-on-surface-variant/50 hover:text-on-surface transition-colors z-50">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-secondary mb-1 font-h2">Meditación Flash</h2>
            <p className="text-sm text-on-surface-variant/70 mb-10 font-medium tracking-wide">Un minuto para volver a ti</p>

            <div className="relative w-48 h-48 flex items-center justify-center mb-10">
              {/* Círculo animado de respiración */}
              <div className={`absolute inset-0 bg-secondary-container/50 rounded-full transition-transform duration-[4000ms] ease-in-out ${isMeditating && breathAction.includes('Inhala') ? 'scale-[1.7]' : 'scale-100'}`}></div>
              <div className="absolute inset-6 bg-secondary-fixed rounded-full shadow-[0_0_30px_rgba(228,223,255,0.4)] flex items-center justify-center z-10">
                <span className="text-4xl font-light text-secondary font-h1">{meditationTimeLeft}s</span>
              </div>
            </div>

            <h3 className="text-xl font-medium text-on-surface mb-8 h-8 transition-opacity font-h3 italic">
              {breathAction}
            </h3>

            {!isMeditating && meditationTimeLeft > 0 ? (
              <button onClick={startMeditation} className="w-full px-6 py-3.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-secondary/20">
                Comenzar
              </button>
            ) : meditationTimeLeft === 0 ? (
              <button onClick={closeMeditation} className="w-full px-6 py-3.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                Finalizar y Agradecer
              </button>
            ) : (
              <button onClick={closeMeditation} className="w-full px-6 py-3 bg-surface/30 text-on-surface rounded-xl text-sm font-semibold hover:bg-surface/50 transition-all border border-white/20">
                Pausar y Salir
              </button>
            )}
          </div>
        </div>
      )}

      {/* BottomNavBar */}
      <nav className="fixed bottom-4 sm:bottom-6 left-0 right-0 flex justify-between items-center h-16 sm:h-20 z-50 px-3 sm:px-5 mx-auto max-w-md bg-white/40 dark:bg-surface-container-highest/40 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_10px_40px_rgba(114,84,119,0.25)] rounded-full w-[94%] sm:w-[90%] transition-all">
        {[
          { id: 'universo', label: 'Universo', icon: <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
          { id: 'manifestar', label: 'Manifestar', icon: <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2.5 21.5l14-14M22 2l-2 2M22 6l-2-2M18 2l2 2M2 6l2-2M2 2l2 2M6 2l-2 2"/></svg> },
          { id: 'diario', label: 'Diario', icon: <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
          { id: 'oraculo', label: 'Oráculo', icon: <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
          { id: 'guia', label: 'Guía', icon: <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center justify-center transition-all duration-300 ease-in-out rounded-full ${
              activeTab === item.id 
                ? 'bg-gradient-to-br from-primary-container to-tertiary-container text-on-primary-container px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-sm'
                : 'p-2 sm:p-2.5 text-on-surface-variant opacity-60 hover:opacity-100 hover:scale-110'
            }`}
          >
            <div className="flex-shrink-0">{item.icon}</div>
            <span className={`text-xs sm:text-sm font-semibold tracking-wide overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
              activeTab === item.id ? 'max-w-[100px] opacity-100 ml-1.5 sm:ml-2' : 'max-w-0 opacity-0 ml-0'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
