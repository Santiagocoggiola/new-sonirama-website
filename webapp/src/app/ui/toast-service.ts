"use client";

type ToastMsg = {
  severity?: "success" | "info" | "warn" | "error";
  summary?: string;
  detail?: string;
  life?: number;
};

let ref: { show: (msg: ToastMsg | ToastMsg[]) => void } | null = null;

export function setToastRef(r: unknown) {
  // guard minimal surface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyRef = r as any;
  if (anyRef && typeof anyRef.show === "function") {
    ref = anyRef as { show: (msg: ToastMsg | ToastMsg[]) => void };
  }
}

export function showToast(message: ToastMsg | ToastMsg[]) {
  ref?.show(message);
}

export function toastSuccess(summary: string, detail?: string, life = 3000) {
  showToast({ severity: "success", summary, detail, life });
}

export function toastError(summary: string, detail?: string, life = 4000) {
  showToast({ severity: "error", summary, detail, life });
}
