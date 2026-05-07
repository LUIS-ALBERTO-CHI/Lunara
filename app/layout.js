import './globals.css';

export const metadata = {
  title: 'Positiva',
  description: 'Positiva App Espiritual',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#fef8f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="light">
      <head>
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,500;0,600;1,500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              darkMode: "class",
              theme: {
                extend: {
                  colors: {
                    "primary-fixed": "#fcd7ff",
                    "surface-bright": "#fef8f1",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed": "#30111d",
                    "secondary-fixed-dim": "#c7bfff",
                    "on-tertiary-container": "#6f4755",
                    "background": "#fef8f1",
                    "surface": "#fef8f1",
                    "on-secondary-fixed-variant": "#453b8a",
                    "on-secondary": "#ffffff",
                    "surface-container-lowest": "#ffffff",
                    "error-container": "#ffdad6",
                    "inverse-on-surface": "#f6f0e9",
                    "outline": "#7d747c",
                    "on-background": "#1d1b17",
                    "on-secondary-fixed": "#18065e",
                    "surface-container-highest": "#e7e2db",
                    "surface-container-high": "#ede7e0",
                    "inverse-surface": "#32302c",
                    "on-tertiary-fixed-variant": "#623b49",
                    "surface-dim": "#dfd9d2",
                    "surface-container-low": "#f9f3ec",
                    "secondary-container": "#b0a6fd",
                    "primary-container": "#e0bbe4",
                    "surface-container": "#f3ede6",
                    "on-primary-fixed-variant": "#593d5f",
                    "on-primary-fixed": "#2a1131",
                    "secondary-fixed": "#e4dfff",
                    "outline-variant": "#cfc3cc",
                    "tertiary-fixed-dim": "#edb8c8",
                    "surface-variant": "#e7e2db",
                    "on-primary-container": "#66496b",
                    "on-surface": "#1d1b17",
                    "on-secondary-container": "#413886",
                    "on-error-container": "#93000a",
                    "tertiary": "#7c5360",
                    "primary": "#725477",
                    "primary-fixed-dim": "#dfbbe4",
                    "inverse-primary": "#dfbbe4",
                    "surface-tint": "#725477",
                    "on-surface-variant": "#4c444c",
                    "tertiary-fixed": "#ffd9e3",
                    "tertiary-container": "#eeb9c9",
                    "on-error": "#ffffff",
                    "on-primary": "#ffffff",
                    "secondary": "#5d54a4",
                    "on-tertiary": "#ffffff"
                  },
                  borderRadius: { "DEFAULT": "1rem", "lg": "2rem", "xl": "3rem", "full": "9999px" },
                  spacing: { "unit": "8px", "gutter": "16px", "container-padding": "24px", "section-gap": "48px" },
                  fontFamily: { "h2": ["Newsreader"], "body-lg": ["plusJakartaSans"], "body-md": ["plusJakartaSans"], "h3": ["Newsreader"], "h1": ["Newsreader"], "label-sm": ["plusJakartaSans"] },
                  fontSize: {
                    "h2": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "500"}],
                    "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "h3": ["24px", {"lineHeight": "1.3", "fontWeight": "500"}],
                    "h1": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                    "label-sm": ["12px", {"lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "600"}]
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body className="font-body-md text-on-surface antialiased overflow-x-hidden" style={{ minHeight: 'max(884px, 100dvh)' }}>
        {children}
      </body>
    </html>
  );
}
