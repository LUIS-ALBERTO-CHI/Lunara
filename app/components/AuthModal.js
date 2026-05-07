'use client';

import { useState } from 'react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error en autenticación');
        return;
      }

      // Llamar callback de éxito
      onAuthSuccess({
        userId: data.userId,
        email: data.email,
        profilePhotoUrl: data.profilePhotoUrl,
      });

      // Limpiar formulario
      setEmail('');
      setPassword('');
      onClose();
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass rounded-lg p-8 max-w-md w-full shadow-2xl border border-white/20">
        <h2 className="font-h2 text-h2 text-primary mb-2 text-center">
          {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
        </h2>
        <p className="text-center text-on-surface-variant text-sm mb-6">
          {isLogin
            ? 'Inicia sesión para personalizar tu experiencia'
            : 'Crea una cuenta para guardar tu perfil'}
        </p>

        {error && (
          <div className="bg-error/20 border border-error rounded-lg p-3 mb-4 text-error text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface/50 border border-white/20 text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface/50 border border-white/20 text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
            required
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-on-primary py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isLoading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-primary text-sm hover:underline"
            disabled={isLoading}
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
          disabled={isLoading}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
