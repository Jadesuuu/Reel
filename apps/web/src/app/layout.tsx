import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reel',
  description: 'Job-hunt pipeline tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
