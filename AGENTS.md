# AGENTS.md

## Propósito
Guía para agentes y colaboradores. Prioriza código limpio, modular, refactorizado y fácil de entender.

---

## Principios de trabajo
- **Claridad > cleverness**: nombres explícitos, lógica simple, sin magia.
- **Modularidad**: componentes pequeños, funciones cortas y reutilizables.
- **Responsabilidad única**: cada archivo/módulo debe hacer una sola cosa bien.
- **Refactor continuo**: si tocás un área, mejorala sin romper APIs públicas.
- **Consistencia**: seguí los patrones existentes en la base de código.
- **Errores visibles**: manejo de errores con mensajes claros y toast cuando aplica.
- **UI estable**: evitar re-renderes innecesarios y flicker.

---

## Contexto del proyecto
Plataforma de e-commerce con panel admin y catálogo para usuarios.
- **Backend**: ASP.NET Core + EF Core + PostgreSQL.
- **Frontend**: Next.js + PrimeReact + RTK Query.

---

## Funcionalidades actuales (resumen)
- **Catálogo** (admin/usuario) con scroll infinito (PrimeReact VirtualScroller) y filtros.
- **Productos**: crear/editar, activar/desactivar, eliminar permanente, imágenes y descuentos por cantidad.
- **Categorías**: gestión admin, multi-categoría por producto.
- **Órdenes**: aprobación, confirmación, cancelación, modificaciones, historial y motivos.
- **Carrito**: agregar/quitar, vaciar con confirmación, resumen con descuentos.
- **Usuarios**: administración, descuento por usuario, perfil.
- **Notificaciones**: listado y estado de lectura.
- **Modales PrimeReact** para acciones sensibles (borrar/cancelar/rechazar/etc.).

---

## Reglas para cambios
- **Siempre actualizar AGENTS.md** cuando:
  - Se agrega un nuevo módulo/feature.
  - Se elimina o cambia un flujo importante.
  - Se agrega una integración externa (API, servicio, librería).
- **Tests obligatorios**: crear tests unitarios en backend; en frontend cuando aplique; y si se agrega una página/vista o funcionalidad nueva, sumar test de Playwright.
- **Evitar lógica duplicada**: preferir helpers o hooks compartidos.
- **Tipado fuerte**: no usar `any` salvo necesidad justificada.
- **Paginación**: endpoints de listado deben ser paginados.
- **Confirmaciones**: acciones destructivas requieren modal PrimeReact.

---

## Convenciones de UI
- Usar componentes de PrimeReact cuando sea posible.
- Mantener estilos en la capa de componentes (evitar estilos globales nuevos sin necesidad).
- Preferir `Dialog`, `DataTable`, `VirtualScroller` para listas y modales.

---

## Qué revisar antes de mergear
- ¿Se mantuvo la modularidad?
- ¿Se actualizó AGENTS.md si corresponde?
- ¿La UI mantiene consistencia visual?
- ¿El backend mantiene paginación y validaciones?
- ¿Se respetan roles (ADMIN/USER)?

---

## Notas adicionales
- Evitar prompts/confirm nativos: usar siempre modales PrimeReact.
- Mantener el catálogo responsivo y con buen rendimiento.
- Si hay una feature nueva, agregarla a “Funcionalidades actuales”.
