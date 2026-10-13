import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'E-Cell JEC Portal | Candidate Management & Recruitment',
  description: 'Systematic management portal for E-Cell JEC recruitments, candidate evaluation, and demographic analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full w-full overflow-x-hidden bg-[#f8fafc]">
      <body className="min-h-full w-full max-w-full overflow-x-hidden flex flex-col font-sans text-slate-900 bg-[#f8fafc] antialiased">
        {children}
      </body>
    </html>
  );
}
