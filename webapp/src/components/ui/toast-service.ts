'use client';

/**
 * Toast service for showing notifications
 * Used by both components and SignalR handlers
 */

type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ToastMessage {
  severity?: ToastSeverity;
  summary?: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  contentClassName?: string;
}

interface ToastRef {
  show: (message: ToastMessage | ToastMessage[]) => void;
  clear: () => void;
}

let toastRef: ToastRef | null = null;

/**
 * Set the toast reference from GlobalToast component
 */
export function setToastRef(ref: unknown) {
  if (ref && typeof (ref as ToastRef).show === 'function') {
    toastRef = ref as ToastRef;
  }
}

/**
 * Clear the toast reference
 */
export function clearToastRef() {
  toastRef = null;
}

/**
 * Show a toast message
 */
export function showToast(message: ToastMessage | ToastMessage[]) {
  if (toastRef) {
    toastRef.show(message);
  } else {
    console.warn('Toast ref not set. Message:', message);
  }
}

/**
 * Clear all toast messages
 */
export function clearToasts() {
  toastRef?.clear();
}

/**
 * Show a success toast
 */
export function toastSuccess(summary: string, detail?: string, life = 3000) {
  showToast({ severity: 'success', summary, detail, life });
}

/**
 * Show an error toast
 */
export function toastError(summary: string, detail?: string, life = 5000) {
  showToast({ severity: 'error', summary, detail, life });
}

/**
 * Show a warning toast
 */
export function toastWarn(summary: string, detail?: string, life = 4000) {
  showToast({ severity: 'warn', summary, detail, life });
}

/**
 * Show an info toast
 */
export function toastInfo(summary: string, detail?: string, life = 3000) {
  showToast({ severity: 'info', summary, detail, life });
}
