export const metadata = {
  title: "Recuperar contraseña",
};

import { Card } from "primereact/card";
import { Message } from "primereact/message";

export default async function ForgotPasswordPage() {
  return (
    <main className="surface-ground" style={{ minHeight: '100svh' }}>
      <section className="flex align-items-center justify-content-center" style={{ minHeight: '100svh' }}>
        <div className="w-full" style={{ maxWidth: 560 }}>
          <Card title="Recuperar contraseña">
            <Message severity="info" text="Dejanos tu email en el formulario de contacto para solicitar el restablecimiento o acceso." />
          </Card>
        </div>
      </section>
    </main>
  );
}
