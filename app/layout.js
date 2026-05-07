export const metadata = {
  title: 'Mi PWA',
  description: 'PWA con notificaciones push',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
