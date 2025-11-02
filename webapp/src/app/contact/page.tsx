import ContactForm from "@/app/ui/contact-form";
import { Message } from "primereact/message";
import { Card } from "primereact/card";

export const metadata = {
  title: "Contacto | Solicitar acceso",
};

export default async function ContactPage() {
  return (
    <main className="surface-ground" style={{ minHeight: '100svh' }}>
      <section className="flex align-items-center justify-content-center" style={{ minHeight: '100svh' }}>
        <div className="w-full" style={{ maxWidth: 560 }}>
          <Card title="Contacto">
            <div className="mb-3">
              <Message severity="info" text="Si necesitás acceso al sitio, completá el formulario y nos pondremos en contacto." />
            </div>
            <ContactForm />
          </Card>
        </div>
      </section>
    </main>
  );
}
