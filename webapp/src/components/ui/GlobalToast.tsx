'use client';

import { useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { setToastRef, clearToastRef } from './toast-service';

interface GlobalToastProps {
  /** Toast position */
  position?: 'center' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** Base z-index */
  baseZIndex?: number;
}

/**
 * Global toast component that provides toast notifications across the app
 * Must be mounted once in the root layout
 */
export function GlobalToast({
  position = 'top-right',
  baseZIndex = 9999,
}: GlobalToastProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toastRef = useRef<any>(null);

  useEffect(() => {
    if (toastRef.current) {
      setToastRef(toastRef.current);
    }

    return () => {
      clearToastRef();
    };
  }, []);

  return (
    <Toast
      ref={toastRef}
      position={position}
      baseZIndex={baseZIndex}
      id="global-toast"
      data-testid="global-toast"
    />
  );
}
