import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DoorSignal — The Physical Inbox for Your Business',
  description: 'Turn arrivals into workflows with Ring and intelligent context matching.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F3F0E7] text-[#172221]">
        {children}
      </body>
    </html>
  );
}
