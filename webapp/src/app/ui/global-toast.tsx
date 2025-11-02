"use client";

import { useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { setToastRef } from "@/app/ui/toast-service";

export default function GlobalToast() {
  const ref = useRef<unknown>(null);
  useEffect(() => {
    setToastRef(ref.current);
  }, []);

  return <Toast ref={ref} position="top-center" />;
}
