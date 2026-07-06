import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ladeway — AI-Powered Conversational Qualification',
  description:
    'Industry-agnostic AI platform that qualifies leads through natural conversation. Configure a custom AI persona, define qualification fields, and go live instantly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
