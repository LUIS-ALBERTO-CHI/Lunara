'use client';

import { useState, useRef } from 'react';

export default function PhotoUploadModal({ isOpen, onClose, userId, onPhotoUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Crear preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!preview) {
      setError('Selecciona una foto primero');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Aquí puedes usar Cloudinary, AWS S3, o similar
      // Por ahora, usaremos la URL de data base64 directamente
      const res = await fetch('/api/auth/profile-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: preview }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al guardar foto');
        return;
      }

      onPhotoUpdate(preview);
      setPreview('');
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="glass rounded-lg p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/20">
        <h2 className="text-lg sm:text-2xl font-bold text-primary mb-6 text-center">Tu Foto de Perfil</h2>

        {error && (
          <div className="bg-error/20 border border-error rounded-lg p-3 mb-4 text-error text-xs sm:text-sm">
            {error}
          </div>
        )}

        {preview && (
          <div className="mb-6 flex justify-center">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-primary">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full mb-4 px-4 py-2 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-60 text-sm"
        >
          {preview ? 'Cambiar Foto' : 'Seleccionar Foto'}
        </button>

        <button
          onClick={handleUpload}
          disabled={isLoading || !preview}
          className="w-full bg-primary text-on-primary py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-60 mb-3 text-sm"
        >
          {isLoading ? 'Guardando...' : 'Guardar Foto'}
        </button>

        <button
          onClick={onClose}
          disabled={isLoading}
          className="w-full px-4 py-2 rounded-lg bg-surface/50 text-on-surface hover:bg-surface/80 transition-colors text-sm"
        >
          Cancelar
        </button>

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
