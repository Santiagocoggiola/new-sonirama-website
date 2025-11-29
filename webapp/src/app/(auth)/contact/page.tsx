import { Metadata } from 'next';
import { ContactForm } from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contacto - Sonirama',
  description: 'Contactanos para cualquier consulta',
};

/**
 * Contact page (public)
 */
export default function ContactPage() {
  return (
    <div id="contact-page" data-testid="contact-page">
      <h1 className="text-2xl font-bold text-center m-0 mb-2 text-color">
        Contacto
      </h1>
      <p className="text-center text-color-secondary m-0 mb-4">
        ¿Tenés alguna pregunta o sugerencia? Escribinos y te responderemos a la brevedad.
      </p>
      <ContactForm testId="contact-form" />
    </div>
  );
}
