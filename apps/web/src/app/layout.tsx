import type { Metadata } from 'next';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import './globals.css';
export const metadata: Metadata = { title: 'DoorSignal — From doorbell to done.', description: 'Turn Ring door events into guest, delivery, and service workflows—with clear ownership and no facial recognition.', metadataBase: new URL('https://doorsignal.site'), manifest: '/manifest.webmanifest' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
