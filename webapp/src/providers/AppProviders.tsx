'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { PrimeReactProvider } from 'primereact/api';
import { makeStore, type AppStore } from '@/store';
import { ThemeProvider } from './ThemeProvider';
import { RealtimeProvider } from './RealtimeProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers for the Sonirama application
 * Includes Redux, PrimeReact, and Theme providers
 */
export function AppProviders({ children }: AppProvidersProps) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <PrimeReactProvider value={{ ripple: true }}>
        <ThemeProvider>
          <RealtimeProvider />
          {children}
        </ThemeProvider>
      </PrimeReactProvider>
    </Provider>
  );
}

export default AppProviders;
