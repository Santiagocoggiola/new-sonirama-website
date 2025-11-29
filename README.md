# Sonirama API Reference

This document describe todas las rutas disponibles en la Web API (.NET 9) para que el equipo de frontend pueda integrar cada funcionalidad sin tener que leer el código. Incluye para cada router: endpoints, autorización, payloads y formatos de respuesta.

> **Nota**: La aplicación también contiene un frontend (`/webapp`), pero este README está enfocado exclusivamente en la API (`src/Sonirama.Api`).

## Requisitos previos

| Requisito | Versión | Descripción |
| --- | --- | --- |
| .NET SDK | 9.0+ | [Descargar](https://dotnet.microsoft.com/download) |
| Node.js | 20+ | Solo para el frontend (`/webapp`) |
| Docker | Latest | Para PostgreSQL via `docker-compose` |
| PostgreSQL | 15+ | Se levanta con Docker o instalar manualmente |

### Inicio rápido

```powershell
# 1. Levantar base de datos
docker compose up -d

# 2. Restaurar dependencias y aplicar migraciones
cd src/Sonirama.Api
dotnet restore
dotnet ef database update

# 3. Ejecutar API
dotnet run

# 4. (Opcional) Frontend
cd webapp
npm install
npm run dev
```

## Base URL y autenticación

- Base URL recomendada en desarrollo: `https://localhost:5001` (ver consola al ejecutar `dotnet run`).
- Todos los endpoints expuestos bajo `/api/*`.
- Autenticación vía **JWT Bearer**. Enviar el token en el header:

```
Authorization: Bearer <access_token>
```

- Roles soportados: `ADMIN` y `USER`. La tabla de cada router indica qué rol necesita cada endpoint.

## Formato de errores

El middleware `ExceptionHandlingMiddleware` transforma las excepciones de dominio en JSON uniforme:

```json
{
    "error": "Mensaje en español descriptivo",
    "detalles": {
        "Campo": ["Regla X", "Regla Y"]
    }
}
```

- `detalles` solo aparece cuando la validación genera múltiples errores (`ValidationException`).
- Errores no controlados devuelven `500` con `{ "error": "Error interno del servidor" }`.

## Resultado paginado (`PagedResult<T>`)

Los listados principales usan el envoltorio:

```json
{
    "page": 1,
    "pageSize": 20,
    "totalCount": 120,
    "items": [ ... ]
}
```

- `page` y `pageSize` son enteros positivos.
- `totalCount` representa la cantidad total de registros antes de paginar.
- `items` contiene el array del DTO específico (usuarios, productos, etc.).

## Archivos estáticos e imágenes de productos

- Las imágenes que se suben vía API se guardan bajo `src/Sonirama.Api/wwwroot/images/products/{codigo-sanitizado}`. La API expone esos assets automáticamente porque ahora ejecuta `UseStaticFiles()`, por lo que estarán disponibles en `https://<host>/images/products/...`.
- El nuevo esquema requiere la migración `AddProductImages`. Si todavía no la aplicaste, ejecuta:

```powershell
dotnet tool restore --tool-manifest src/Sonirama.Api/.config/dotnet-tools.json
dotnet ef database update --project src/Sonirama.Api --startup-project src/Sonirama.Api
```

- Aceptamos formatos `jpg`, `png` y `webp` de hasta **5 MB** por archivo y máximo **10 imágenes por solicitud**. El backend valida y normaliza automáticamente el nombre de la carpeta usando el código del producto.
- Si el archivo original es `jpg`/`jpeg` o `png`, se vuelve a codificar a **WebP** (calidad ~80) antes de guardarlo para ahorrar espacio; los `.webp` originales se almacenan tal cual.
- Cada elemento expuesto por la API incluye la propiedad `url`, que ya viene lista para consumirse desde el frontend (`/images/products/<codigo>/<archivo>`). Si necesitas la ruta relativa en disco puedes usar `relativePath`.

## Tabla de contenidos

1. [Auth (`/api/auth`)](#auth-apiauth)
2. [Users (`/api/users`)](#users-apiusers)
3. [Products (`/api/products`)](#products-apiproducts)
    - [Product images (`/api/products/{id}/images`)](#product-images-apiproductsidimages)
4. [Bulk Discounts (`/api/products/{productId}/discounts`)](#bulk-discounts-apiproductsproductiddiscounts)
5. [Categories (`/api/categories`)](#categories-apicategories)
6. [Cart (`/api/cart`)](#cart-apicart)
7. [Orders (`/api/orders`)](#orders-apiorders)
8. [Contact (`/api/contact`)](#contact-apicontact)
9. [Notifications REST (`/api/notifications`)](#notifications-rest-apinotifications)
10. [Health Check (`/health`)](#health-check-health)
11. [Notifications SignalR (`/hubs/orders`)](#notifications-signalr-hubsorders)

---

## Auth (`/api/auth`)

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| POST | `/api/auth/login` | Público | Obtiene tokens `access` + `refresh`.
| POST | `/api/auth/refresh` | Público | Renueva tokens usando el `refreshToken`.
| POST | `/api/auth/logout` | `Bearer` | Revoca un `refreshToken` específico.
| POST | `/api/auth/logout-all` | `Bearer` | Revoca todos los refresh tokens del usuario autenticado.

### POST `/api/auth/login`

- **Body (`application/json`)**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | `string` | ✔︎ | Email del usuario.
| `password` | `string` | ✔︎ | Password plano.

- **Response 200 (`AuthResponse`)**

```json
{
    "accessToken": "jwt...",
    "refreshToken": "guid-o-similar",
    "expiresAtUtc": "2025-11-21T15:30:00Z",
    "role": "ADMIN",
    "email": "user@dominio.com"
}
```

### POST `/api/auth/refresh`

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `refreshToken` | `string` | ✔︎ |

Respuesta 200: mismo `AuthResponse` que en login.

### POST `/api/auth/logout`

- **Auth**: Bearer obligatorio.
- **Body**: `refreshToken` (igual que en refresh).
- **Response 200**: `{ "mensaje": "Sesión cerrada" }`.

### POST `/api/auth/logout-all`

- **Auth**: Bearer obligatorio (usa el `sub` o `nameidentifier` del JWT).
- **Body**: vacío.
- **Response 200**: `{ "mensaje": "Sesiones revocadas", "cantidad": <int> }`.

### Sistema de Lockout (protección contra fuerza bruta)

El sistema bloquea temporalmente las cuentas después de múltiples intentos fallidos de login:

| Configuración | Valor |
| --- | --- |
| Intentos permitidos | 5 |
| Duración del bloqueo | 15 minutos |

**Comportamiento:**
- Cada intento fallido incrementa `FailedLoginAttempts`.
- Al alcanzar 5 intentos, se bloquea la cuenta por 15 minutos.
- Un login exitoso resetea el contador.
- Durante el lockout, el login retorna error 401 con mensaje descriptivo.

**Response 401 durante lockout:**
```json
{
    "error": "Cuenta bloqueada temporalmente. Intentá de nuevo en 14 minutos."
}
```

---

## Users (`/api/users`)

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| GET | `/api/users` | `ADMIN,USER` | Lista paginada de usuarios.
| GET | `/api/users/{id}` | `ADMIN,USER` | Obtiene un usuario por `Guid`.
| POST | `/api/users` | `ADMIN` | Crea un nuevo usuario.
| PUT | `/api/users/{id}` | `ADMIN` | Actualiza un usuario existente.
| DELETE | `/api/users/{id}` | `ADMIN` | Soft delete (desactiva) o elimina.
| POST | `/api/users/password-reset/start` | Público | Inicia flujo de reset (en base a `email`).
| POST | `/api/users/password-reset/confirm` | Público | Confirma código de reset.
| POST | `/api/users/{id}/password-reset/force` | `ADMIN` | Genera reset directo para un usuario.

### GET `/api/users`

**Query params**

| Param | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `page` | `int` | 1 | Página actual.
| `pageSize` | `int` | 20 | Tamaño de página.
| `query` | `string` | - | Búsqueda por nombre o email.
| `role` | `string` | - | Filtra por rol exacto.
| `isActive` | `bool` | - | Filtra activos/inactivos.
| `sortBy` | `string` | `CreatedAt` | Campos: `Email`, `FirstName`, `LastName`, `CreatedAt`.
| `sortDir` | `string` | `DESC` | `ASC` o `DESC`.

**Response 200**: `PagedResult<UserDto>` con cada item:

```json
{
    "id": "guid",
    "email": "user@dominio.com",
    "firstName": "Nombre",
    "lastName": "Apellido",
    "phoneNumber": "+54911...",
    "role": "ADMIN",
    "isActive": true,
    "createdAtUtc": "2025-11-20T12:00:00Z",
    "updatedAtUtc": "2025-11-21T08:30:00Z"
}
```

### POST `/api/users`

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | `string` | ✔︎ | Email único.
| `firstName` | `string` | ✔︎ |
| `lastName` | `string` | ✔︎ |
| `phoneNumber` | `string` | ✖︎ |
| `role` | `string` | ✖︎ | Valores: `ADMIN`, `USER`. Default `USER`.

**Response 201**: `UserDto` completo.

### PUT `/api/users/{id}`

Body igual a `UserUpdateRequest`:

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `firstName`, `lastName` | `string` | ✔︎ |
| `phoneNumber` | `string` | ✖︎ |
| `role` | `string` | ✔︎ |
| `isActive` | `bool` | ✔︎ |

**Response 200**: `UserDto` actualizado.

### Password reset endpoints

- `POST /api/users/password-reset/start?email=foo@bar.com` → 200 vacío.
- `POST /api/users/password-reset/confirm?email=foo@bar.com&code=123456` → 200 vacío.
- `POST /api/users/{id}/password-reset/force` → 200 vacío.

---

## Products (`/api/products`)

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| GET | `/api/products` | `ADMIN,USER` | Listado paginado con filtros.
| GET | `/api/products/{id}` | `ADMIN,USER` | Obtener por Guid.
| GET | `/api/products/code/{code}` | `ADMIN,USER` | Obtener por código público.
| POST | `/api/products` | `ADMIN` | Crear producto.
| PUT | `/api/products/{id}` | `ADMIN` | Actualizar producto.
| POST | `/api/products/{id}/images` | `ADMIN` | Subir entre 1 y 10 imágenes (multipart/form-data).
| DELETE | `/api/products/{id}/images/{imageId}` | `ADMIN` | Eliminar una imagen existente.
| DELETE | `/api/products/{id}` | `ADMIN` | Eliminar.

### GET `/api/products`

**Query params principales**

| Param | Tipo | Descripción |
| --- | --- | --- |
| `page`, `pageSize` | `int` | Igual que en usuarios.
| `query` | `string` | Busca en `Code`, `Name`, `Category`.
| `category` | `string` | Coincidencia exacta.
| `categoryIds` | `Guid[]` | IDs de categorías relacionadas.
| `priceMin` / `priceMax` | `decimal` | Rango de precio.
| `isActive` | `bool` | Filtro de estado.
| `sortBy` | `string` | `CreatedAt`, `Code`, `Name`, `Price`.
| `sortDir` | `string` | `ASC` / `DESC`.

**Respuesta 200**: `PagedResult<ProductDto>` donde cada ítem contiene `id`, `code`, `name`, `description`, `price`, `currency`, `category`, `minBulkQuantity`, `isActive`, `createdAtUtc`, `updatedAtUtc` **y** `images` (array de `ProductImageDto`).

### POST `/api/products`

| Campo | Tipo | Requerido | Nota |
| --- | --- | --- | --- |
| `code` | `string` | ✔︎ | Único, inmutable luego.
| `name` | `string` | ✔︎ |
| `description` | `string` | ✖︎ |
| `price` | `decimal` | ✔︎ |
| `currency` | `string` | ✖︎ | Default `ARS`.
| `category` | `string` | ✖︎ |
| `isActive` | `bool` | ✖︎ | Default `true`.

**Response 201**: `ProductDto`.

### PUT `/api/products/{id}`

- Body igual a `ProductUpdateRequest` (sin `code`).
- Response 200 con `ProductDto` actualizado.

### GET `/api/products/{id}` y `/api/products/code/{code}`

- Devuelven un único `ProductDto`.

### DELETE `/api/products/{id}`

- Response 204 sin contenido.

### Product images (`/api/products/{id}/images`)

#### DTO `ProductImageDto`

```json
{
    "id": "guid",
    "productId": "guid",
    "fileName": "20251121_abc.jpg",
    "relativePath": "images/products/p001/20251121_abc.jpg",
    "url": "/images/products/p001/20251121_abc.jpg",
    "uploadedAtUtc": "2025-11-21T12:34:56Z"
}
```

#### POST `/api/products/{id}/images`

- **Auth**: `ADMIN`.
- **Content-Type**: `multipart/form-data`.
- **Campo** `files`: permite entre 1 y 10 archivos (`jpg`, `png` o `webp`). Cada uno debe pesar ≤ 5 MB. Los `.jpg/.png` se convierten automáticamente a `.webp` manteniendo la mejor calidad posible.
- **Response 200**: Array de `ProductImageDto` con las imágenes recién creadas. Los archivos quedan disponibles inmediatamente en `https://host/images/products/{code}/...` usando la propiedad `url` devuelta.

#### DELETE `/api/products/{id}/images/{imageId}`

- **Auth**: `ADMIN`.
- Borra tanto el registro como el archivo físico del disco.
- **Response 204** sin cuerpo.

---

## Bulk Discounts (`/api/products/{productId}/discounts`)

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| GET | `/api/products/{productId}/discounts` | `ADMIN,USER` | Lista los descuentos escalonados de un producto.
| POST | `/api/products/{productId}/discounts` | `ADMIN` | Crea un descuento para el producto.
| PUT | `/api/products/{productId}/discounts/{id}` | `ADMIN` | Actualiza un descuento existente.
| DELETE | `/api/products/{productId}/discounts/{id}` | `ADMIN` | Elimina un descuento.

### Estructura `BulkDiscountDto`

```json
{
    "id": "guid",
    "productId": "guid",
    "minQuantity": 10,
    "discountPercent": 15.0,
    "startsAtUtc": "2025-11-01T00:00:00Z",
    "endsAtUtc": "2025-12-31T23:59:59Z",
    "isActive": true
}
```

### Campos de creación/actualización

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `minQuantity` | `int` | ✔︎ |
| `discountPercent` | `decimal` | ✔︎ |
| `startsAt` | `string (ISO 8601)` | ✖︎ |
| `endsAt` | `string (ISO 8601)` | ✖︎ |
| `isActive` | `bool` | ✖︎ (default `true`)

- `POST` responde 201 con `BulkDiscountDto`.
- `PUT` responde 200 con `BulkDiscountDto`.
- `DELETE` responde 204 sin cuerpo.

---

## Categories (`/api/categories`)

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| GET | `/api/categories` | `ADMIN,USER` | Lista paginada con filtros.
| GET | `/api/categories/{id}` | `ADMIN,USER` | Obtiene detalle.
| POST | `/api/categories` | `ADMIN` | Crea categoría.
| PUT | `/api/categories/{id}` | `ADMIN` | Actualiza categoría.
| DELETE | `/api/categories/{id}` | `ADMIN` | Elimina.

### DTO principal

```json
{
    "id": "guid",
    "name": "Audio",
    "slug": "audio",
    "description": "Equipos de sonido",
    "isActive": true,
    "createdAtUtc": "2025-11-20T12:00:00Z",
    "updatedAtUtc": null,
    "parentIds": ["guid"],
    "childIds": ["guid"]
}
```

### Campos para crear/actualizar

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `name` | `string` | ✔︎ |
| `slug` | `string` | ✔︎ | Único.
| `description` | `string` | ✖︎ |
| `isActive` | `bool` | ✖︎ | Default `true`.
| `parentIds` | `Guid[]` | ✖︎ | Permite múltiples padres para la relación jerárquica.

### Filtros disponibles (`GET /api/categories`)

| Param | Tipo | Descripción |
| --- | --- | --- |
| `page`, `pageSize` | `int` | Paginación estándar.
| `query` | `string` | Busca por `name` o `slug`.
| `isActive` | `bool` | Estado.
| `sortBy` | `string` | `Name`, `Slug`, `CreatedAt`.
| `sortDir` | `string` | `ASC`/`DESC`.

---

## Cart (`/api/cart`)

Todos los endpoints requieren `Bearer` y rol `ADMIN` o `USER` (el carrito es por usuario autenticado).

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| GET | `/api/cart` | Obtiene el carrito completo del usuario (se crea en blanco si no existe).
| POST | `/api/cart/items` | Agrega o incrementa un producto en el carrito.
| DELETE | `/api/cart/items/{productId}` | Decrementa o elimina un producto.
| POST | `/api/cart/checkout` | Convierte el carrito actual en un pedido (`OrderDto`).

### `CartDto`

```json
{
    "id": "guid",
    "items": [
        {
            "productId": "guid",
            "productCode": "SKU-001",
            "productName": "Producto",
            "quantity": 3,
            "unitPriceBase": 100.0,
            "discountPercent": 10.0,
            "unitPriceWithDiscount": 90.0,
            "lineTotal": 270.0,
            "minBulkQuantityApplied": 3
        }
    ],
    "total": 270.0,
    "updatedAtUtc": "2025-11-21T10:00:00Z"
}
```

### POST `/api/cart/items`

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `productId` | `Guid` | ✔︎ |
| `quantity` | `int` | ✔︎ | Debe ser > 0.

**Response 200**: `CartDto` recalculado (con descuentos vigentes).

### DELETE `/api/cart/items/{productId}`

- **Path param**: `productId` (`Guid`).
- **Query param opcional**: `quantity` (`int`).
    - Ausente o >= cantidad actual ⇒ elimina el item completo.
    - Menor a la cantidad ⇒ decrementa y deja el producto en el carrito.
- **Response 200**: `CartDto` actualizado.

### POST `/api/cart/checkout`

- Auth: `Bearer` (`ADMIN` o `USER`).
- Body: vacío (opcionalmente se puede enviar `{}` si tu cliente requiere cuerpo JSON).
- Validaciones: el carrito debe tener al menos un ítem y todos los productos deben compartir la misma moneda.
- Response 201 `OrderDto` (ver sección [Orders](#orders-apiorders)). Además, vacía el carrito.

---

## Orders (`/api/orders`)

Los pedidos representan la confirmación del carrito. Siguen el siguiente ciclo de vida:

| Estado | Quién lo dispara | Descripción |
| --- | --- | --- |
| `PendingApproval` | Checkout | Pedido recién creado, pendiente de revisión del staff.
| `Approved` | Admin / Usuario | Aprobado y a la espera de que el usuario confirme.
| `Rejected` | Admin | Rechazado con motivo.
| `ModificationPending` | Admin | Admin modificó cantidades, espera aceptación del usuario.
| `Confirmed` | Usuario | El cliente confirma que avanzará.
| `ReadyForPickup` | Admin | Pedido preparado/listo para retiro o envío.
| `Completed` | Admin | Pedido entregado/completado.
| `Cancelled` | Usuario | El cliente cancela mientras está pendiente/aprobado.

### `OrderDto`

```json
{
        "id": "guid",
        "number": "SO-20251121094501001",
        "status": "Approved",
        "userId": "guid",
        "subtotal": 200.0,
        "discountTotal": 20.0,
        "total": 180.0,
        "currency": "ARS",
        "userNotes": "Quiero retirar el viernes",
        "adminNotes": "Listo para retiro",
        "rejectionReason": null,
        "cancellationReason": null,
        "modificationReason": null,
        "originalTotal": null,
        "modifiedAtUtc": null,
        "createdAtUtc": "2025-11-21T12:30:00Z",
        "updatedAtUtc": "2025-11-21T13:00:00Z",
        "approvedAtUtc": "2025-11-21T12:45:00Z",
        "confirmedAtUtc": "2025-11-21T12:50:00Z",
        "readyAtUtc": "2025-11-21T13:00:00Z",
        "items": [
                {
                        "productId": "guid",
                        "productCode": "SKU-001",
                        "productName": "Producto",
                        "quantity": 2,
                        "unitPrice": 100.0,
                        "discountPercent": 10.0,
                        "unitPriceWithDiscount": 90.0,
                        "lineTotal": 180.0
                }
        ]
}
```

- Los listados (`GET /api/orders`) devuelven `PagedResult<OrderSummaryDto>` con campos: `id`, `number`, `status`, `userId`, `total`, `currency`, `createdAtUtc`, `updatedAtUtc`, `itemCount`.
- Todos los usuarios sólo pueden ver sus propios pedidos; los administradores pueden consultar cualquiera y filtrar por usuario.

### Endpoints principales

| Método | Ruta | Roles | Descripción |
| ------ | ---- | ----- | ----------- |
| GET | `/api/orders` | `ADMIN,USER` | Lista paginada (ver filtros abajo).
| GET | `/api/orders/{id}` | `ADMIN,USER` | Obtiene el detalle (solo dueño o admin).
| POST | `/api/orders/{id}/confirm` | `USER` | Confirma pedido aprobado.
| POST | `/api/orders/{id}/cancel` | `USER` | Cancela pedido mientras esté `PendingApproval`/`Approved`.
| POST | `/api/orders/{id}/approve` | `ADMIN` | Marca como aprobado.
| POST | `/api/orders/{id}/reject` | `ADMIN` | Rechaza con motivo.
| POST | `/api/orders/{id}/ready` | `ADMIN` | Marca como listo para retiro/envío (requiere estado `Confirmed`).
| POST | `/api/orders/{id}/complete` | `ADMIN` | Marca como completado (requiere `ReadyForPickup`).

#### GET `/api/orders`

**Query params** (todos opcionales; los usuarios finales ignoran `userId`):

| Param | Tipo | Descripción |
| --- | --- | --- |
| `page`, `pageSize` | `int` | Paginación estándar.
| `query` | `string` | Busca por `number` o nombre de producto.
| `status` | `OrderStatus` | Filtra por estado.
| `createdFromUtc` / `createdToUtc` | `ISO 8601` | Rango de fechas de creación.
| `sortBy` | `string` | `CreatedAt`, `Number`, `Status`, `Total`.
| `sortDir` | `ASC`/`DESC` | Direccionamiento.
| `userId` | `Guid` | Solo admins, filtra por cliente específico.

Respuesta 200: `PagedResult<OrderSummaryDto>`.

#### GET `/api/orders/{id}`

- Autorización: dueño del pedido o admin.
- Response 200: `OrderDto` completo.

#### Acciones de usuario

- `POST /api/orders/{id}/confirm` → body opcional `{ "note": "Texto opcional" }`.
- `POST /api/orders/{id}/cancel` → body obligatorio `{ "reason": "Motivo" }`.
    - Solo disponible mientras el pedido esté `PendingApproval` o `Approved`.

#### Acciones de administrador

- `POST /api/orders/{id}/approve` → `{ "adminNotes": "Texto opcional" }`.
- `POST /api/orders/{id}/reject` → `{ "reason": "Motivo" }`.
- `POST /api/orders/{id}/ready` → `{ "readyNotes": "Texto opcional" }` (estado previo `Confirmed`).
- `POST /api/orders/{id}/complete` → `{ "completionNotes": "Texto opcional" }` (estado previo `ReadyForPickup`).
- `POST /api/orders/{id}/modify` → `{ "reason": "Motivo", "items": [...], "adminNotes": "Opcional" }` (Admin modifica cantidades, estado cambia a `ModificationPending`).
- `POST /api/orders/{id}/accept-modifications` → `{ "note": "Opcional" }` (Usuario acepta modificaciones, estado cambia a `Approved`).
- `POST /api/orders/{id}/reject-modifications` → `{ "reason": "Motivo obligatorio" }` (Usuario rechaza modificaciones, orden se cancela).

Cada acción devuelve `OrderDto` actualizado y dispara notificaciones en tiempo real.

---

## Contact (`/api/contact`)

Endpoint público para enviar mensajes de contacto. Rate limited: 3 mensajes por minuto por IP.

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| POST | `/api/contact` | Público | Envía un mensaje de contacto. |

### POST `/api/contact`

- **Body (`application/json`)**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `name` | `string` | ✔︎ | Nombre del remitente (máx 100 chars). |
| `email` | `string` | ✔︎ | Email de contacto (válido, máx 255 chars). |
| `subject` | `string` | ✖︎ | Asunto del mensaje (máx 200 chars). |
| `message` | `string` | ✔︎ | Contenido del mensaje (10-5000 chars). |

**Ejemplo de request:**
```json
{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "subject": "Consulta sobre productos",
    "message": "Hola, quisiera saber si tienen stock del producto X..."
}
```

**Response 200 (éxito):**
```json
{
    "success": true,
    "message": "Tu mensaje fue enviado correctamente. Te responderemos a la brevedad."
}
```

**Response 400 (error de validación o envío):**
```json
{
    "success": false,
    "message": "El sistema de contacto no está disponible en este momento."
}
```

### Configuración

Variables de entorno para configurar el sistema de contacto:

| Variable | Descripción | Default |
| --- | --- | --- |
| `Contact__DestinationEmail` | Email donde se reciben los mensajes | (requerido) |
| `Contact__DestinationName` | Nombre del destinatario | `Sonirama Contacto` |
| `Contact__SubjectPrefix` | Prefijo para el asunto | `[Contacto Web]` |
| `Contact__Enabled` | Habilitar/deshabilitar | `true` |

---

## Notifications REST (`/api/notifications`)

API REST para gestionar notificaciones del usuario autenticado.

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| GET | `/api/notifications` | `Bearer` | Lista paginada de notificaciones del usuario. |
| GET | `/api/notifications/unread-count` | `Bearer` | Contador de notificaciones sin leer. |
| POST | `/api/notifications/{id}/read` | `Bearer` | Marcar una notificación como leída. |
| POST | `/api/notifications/read-all` | `Bearer` | Marcar todas las notificaciones como leídas. |
| DELETE | `/api/notifications/{id}` | `Bearer` | Eliminar una notificación. |

### `NotificationDto`

```json
{
    "id": "guid",
    "type": 2,
    "typeName": "OrderApproved",
    "title": "Pedido aprobado",
    "body": "Tu pedido SO-20251121094501001 fue aprobado",
    "referenceId": "order-guid",
    "isRead": false,
    "createdAtUtc": "2025-11-21T12:45:00Z",
    "readAtUtc": null
}
```

#### Tipos de notificación (`NotificationType`)

| Valor | Nombre | Descripción |
| --- | --- | --- |
| 0 | `OrderCreated` | Nuevo pedido creado |
| 1 | `OrderStatusChanged` | Estado del pedido cambió |
| 2 | `OrderApproved` | Pedido aprobado por admin |
| 3 | `OrderRejected` | Pedido rechazado por admin |
| 4 | `OrderReady` | Pedido listo para retiro |
| 5 | `OrderCompleted` | Pedido completado |
| 6 | `OrderCancelled` | Pedido cancelado |
| 7 | `PriceChanged` | Precio de producto cambió |
| 8 | `NewProduct` | Nuevo producto disponible |
| 9 | `PasswordReset` | Contraseña reseteada |
| 10 | `AccountCreated` | Cuenta creada |
| 99 | `System` | Notificación del sistema |

### GET `/api/notifications`

- **Query params**

| Campo | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `page` | `int` | 1 | Página actual. |
| `pageSize` | `int` | 20 | Items por página (máx 100). |
| `isRead` | `bool?` | null | Filtrar por estado (null = todas). |

- **Response 200** → `PagedResult<NotificationDto>`

### GET `/api/notifications/unread-count`

- **Response 200**

```json
{ "count": 5 }
```

### POST `/api/notifications/{id}/read`

- **Response 200** → `NotificationDto` (actualizado)
- **Response 404** → Notificación no encontrada o no pertenece al usuario.

### POST `/api/notifications/read-all`

- **Response 200**

```json
{ "markedAsRead": 10 }
```

### DELETE `/api/notifications/{id}`

- **Response 200** → `{ "deleted": true }`
- **Response 404** → Notificación no encontrada.

---

## Health Check (`/health`)

Endpoint público para verificar el estado de la aplicación y sus dependencias.

- **Response 200**

```json
{
  "status": "Healthy",
  "checks": [
    { "name": "postgres", "status": "Healthy", "duration": 15.5 }
  ],
  "totalDuration": 16.2
}
```

---

## Notifications SignalR (`/hubs/orders`)

El backend expone un hub SignalR para avisos instantáneos de pedidos.

- Endpoint: `wss://<host>/hubs/orders` (o `https` para negociación).
- Auth: mismo token JWT en el header `Authorization`. SignalR lo reenvía automáticamente si usás el cliente oficial.
- Grupos automáticos:
    - `admins`: cualquier conexión autenticada con rol `ADMIN`.
    - `user:{userId}`: cada conexión se suscribe a su propio grupo privado.

### Eventos emitidos

| Evento | Payload | ¿Quién lo recibe? |
| --- | --- | --- |
| `OrderCreated` | `OrderDto` nuevo | Grupo `admins` + grupo del usuario dueño.
| `OrderUpdated` | `OrderDto` actualizado | Grupo `admins` + grupo del usuario dueño.
| `NewNotification` | `NotificationDto` | Usuario destinatario de la notificación.
| `UnreadCountChanged` | `{ count: int }` | Usuario cuando su contador de notificaciones cambia.

### Suscripciones manuales

El hub ofrece métodos opcionales si necesitás unirte a otros usuarios (por ejemplo, paneles compartidos):

- `hubConnection.invoke("SubscribeToUser", "guid-usuario")`
- `hubConnection.invoke("SubscribeToAdmins")` (solo si el caller es admin).

---

### ¿Necesitas algo más?

- Backend: `dotnet run` dentro de `src/Sonirama.Api`.
- Frontend: `npm run dev` dentro de `webapp`.
- Para dudas o nuevos endpoints, documentar cambios en este README y compartirlo con el equipo frontend.