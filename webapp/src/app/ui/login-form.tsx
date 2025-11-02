"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { FloatLabel } from "primereact/floatlabel";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Message } from "primereact/message";
import { toastSuccess, toastError } from "./toast-service";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es obligatorio" })
    .refine(
      (v) => /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(v),
      { message: "Formato de email inválido" }
    ),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  remember: z.boolean()
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "", remember: false }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await new Promise((r) => setTimeout(r, 600));
  toastSuccess("Bienvenido", `Ingresaste como ${values.email}`);
    } catch (err) {
      console.error(err);
  toastError("Error", "No se pudo iniciar sesión");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-column gap-3">
      <div className="flex flex-column gap-2">
        <FloatLabel>
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-envelope" />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <InputText
                  id="email"
                  {...field}
                  placeholder="usuario@empresa.com"
                  className="w-full"
                  autoComplete="email"
                />
              )}
            />
          </IconField>
          <label htmlFor="email" style={{ left: '2.5rem' }}>Email</label>
        </FloatLabel>
  {errors.email && <Message severity="error" text={errors.email.message} />}
      </div>

      <div className="flex flex-column gap-2">
        <FloatLabel>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Password
                id="password"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="••••••••"
                inputClassName="w-full"
                toggleMask
                feedback={false}
                autoComplete="current-password"
              />
            )}
          />
          <label htmlFor="password">Contraseña</label>
        </FloatLabel>
  {errors.password && <Message severity="error" text={errors.password.message} />}
      </div>

      <div className="flex align-items-center gap-2">
        <Controller
          name="remember"
          control={control}
          render={({ field }) => (
            <InputSwitch
              inputId="remember"
              checked={!!field.value}
              onChange={(e) => field.onChange(!!e.value)}
            />
          )}
        />
        <label htmlFor="remember">Recordarme</label>
      </div>

      <Button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
