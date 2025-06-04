import './globals.css';
import type { Metadata } from 'next';
import { GoogleTagManager } from "@next/third-parties/google";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WhatsApp Bulk Messenger',
  description: 'Send bulk WhatsApp messages easily',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <GoogleTagManager gtmId="GTM-N9ZV9PVX" />
      <body className={inter.className}>{children}</body>
    </html>
  );
}
