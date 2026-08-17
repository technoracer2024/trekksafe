import type { Metadata } from 'next';
import './globals.css';
import { TrekSafeProvider } from '@/context/TrekSafeContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CustomCursor from '@/components/layout/CustomCursor';
import EmergencyAlertModal from '@/components/modals/EmergencyAlertModal';
import ToastNotification from '@/components/layout/ToastNotification';

export const metadata: Metadata = {
  title: 'TrekSafe — Every Pilgrim Comes Home',
  description: 'Intelligent high-altitude health telemetry and emergency rescue dispatch for Himalayan pilgrimages.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#060A15] text-slate-900 dark:text-slate-100 antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-300">
        <TrekSafeProvider>
          <CustomCursor />
          <EmergencyAlertModal />
          <ToastNotification />
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </TrekSafeProvider>
      </body>
    </html>
  );
}
