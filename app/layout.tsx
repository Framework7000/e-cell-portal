import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'E-Cell JEC Portal | Candidate Management & Recruitment',
  description: 'Systematic management portal for E-Cell JEC recruitments, candidate evaluation, and demographic analytics.',
  manifest: '/manifest.json',
  themeColor: '#EA580C',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'E-Cell Portal',
  },
  icons: {
    icon: '/ecell-logo.png',
    apple: '/ecell-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full w-full overflow-x-hidden bg-[#f8fafc]">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#EA580C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="E-Cell Portal" />
        <link rel="apple-touch-icon" href="/ecell-logo.png" />
      </head>
      <body className="min-h-full w-full max-w-full overflow-x-hidden flex flex-col font-sans text-slate-900 bg-[#f8fafc] antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

