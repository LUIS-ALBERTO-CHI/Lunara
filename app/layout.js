import './globals.css';

export const metadata = {
  title: 'Vighnaharta',
  description: 'Vighnaharta PWA',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
