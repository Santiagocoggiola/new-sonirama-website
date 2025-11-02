"use client";

import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";

export default function ContactForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const disabled = email.trim().length === 0 || message.trim().length === 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log({ email, message });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-column gap-3">
      <div className="flex flex-column gap-2">
        <FloatLabel>
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-envelope" />
            <InputText
              id="c-email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className="w-full"
              autoComplete="email"
            />
          </IconField>
          <label htmlFor="c-email" style={{ left: '2.5rem' }}>Email</label>
        </FloatLabel>
      </div>

      <div className="flex flex-column gap-2">
        <FloatLabel>
          <InputTextarea
            id="c-msg"
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            placeholder="Contanos brevemente el motivo del acceso"
            className="w-full"
            rows={5}
            autoResize
          />
          <label htmlFor="c-msg">Consulta</label>
        </FloatLabel>
      </div>

      <Button type="submit" disabled={disabled}>
        Enviar consulta
      </Button>
    </form>
  );
}
