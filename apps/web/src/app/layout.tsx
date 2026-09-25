import type { Metadata, Viewport } from 'next';
import { Fragment_Mono, Schibsted_Grotesk } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const sans = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans-face',
  display: 'swap',
});

const mono = Fragment_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-mono-face',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Reel', template: '%s · Reel' },
  description: 'A job-hunt tracker that reads ten sources, scores every posting, and chases you.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
    { media: '(prefers-color-scheme: light)', color: '#ece8df' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
