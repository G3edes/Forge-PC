import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { Toaster } from '@/components/ui/Toast';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Build Forge — PC Builder 3D',
    template: '%s — Build Forge',
  },
  description:
    'Monte seu PC peça por peça, valide a compatibilidade e visualize sua configuração em 3D.',
  applicationName: 'Build Forge',
  keywords: ['pc builder', 'montagem de pc', '3d', 'compatibilidade', 'hardware'],
};

export const viewport: Viewport = {
  themeColor: '#06070b',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">
        <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
