export const metadata = {
  title: 'Vighnaharta',
  description: 'Vighnaharta PWA',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
