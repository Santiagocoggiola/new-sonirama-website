import Image from "next/image";
import Link from "next/link";
import LoginForm from "./ui/login-form";
import { Card } from "primereact/card";

export default async function Page() {
  // Server Component wrapper to keep SSR by default, the form itself is a client component.
  return (
    <main className="surface-ground" style={{ minHeight: '100svh' }}>
      <section className="flex align-items-center justify-content-center" style={{ minHeight: '100svh' }}>
        <div className="w-full" style={{ maxWidth: 560 }}>
          <Card className="mb-4">
            <div className="flex align-items-center gap-3">
              <Image src="/logo.svg" alt="Sonirama" width={48} height={48} priority />
              <div>
                <h1 className="text-2xl font-semibold">Bienvenido</h1>
                <p className="text-color-secondary">Accedé con tu cuenta</p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-color-secondary">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>

            <LoginForm />

            <div className="mt-3 flex flex-wrap align-items-center justify-content-between gap-2 text-sm">
              <Link href="/forgot-password" className="text-primary">
                Me olvidé la contraseña
              </Link>
              <Link href="/contact" className="text-primary">
                Solicitar acceso (Contacto)
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
