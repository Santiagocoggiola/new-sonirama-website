# Sonirama Frontend - Guía de Test IDs para Playwright

Este documento describe todas las vistas, componentes y test IDs disponibles en el frontend de Sonirama para automatización con Playwright.

## Índice

1. [Credenciales de Prueba](#credenciales-de-prueba)
2. [URLs y Rutas](#urls-y-rutas)
3. [Vistas Públicas (Auth)](#vistas-públicas-auth)
4. [Vistas de Usuario (Dashboard)](#vistas-de-usuario-dashboard)
5. [Vistas de Administrador (Admin)](#vistas-de-administrador-admin)
6. [Componentes Compartidos](#componentes-compartidos)
7. [Componentes UI Reutilizables](#componentes-ui-reutilizables)
8. [Flujos de Prueba Sugeridos](#flujos-de-prueba-sugeridos)

---

## Credenciales de Prueba

### Usuario Administrador
- **Email**: `admin@sonirama.com`
- **Password**: `Admin123!`
- **Rol**: `ADMIN`

### Usuario Regular
- Crear mediante registro o seed de base de datos
- **Rol**: `USER`

---

## URLs y Rutas

### Base URLs
- **Frontend**: `http://localhost:3000`
- **API**: `https://localhost:5001`

### Rutas Públicas
| Ruta | Descripción |
|------|-------------|
| `/login` | Página de inicio de sesión |
| `/forgot-password` | Recuperación de contraseña |
| `/contact` | Formulario de contacto |

### Rutas de Usuario (requiere autenticación)
| Ruta | Descripción |
|------|-------------|
| `/products` | Catálogo de productos |
| `/products/[id]` | Detalle de producto |
| `/cart` | Carrito de compras |
| `/orders` | Lista de órdenes del usuario |
| `/orders/[id]` | Detalle de orden |
| `/notifications` | Lista de notificaciones |
| `/profile` | Perfil del usuario |

### Rutas de Administrador (requiere rol ADMIN)
| Ruta | Descripción |
|------|-------------|
| `/admin/products` | Gestión de productos |
| `/admin/products/new` | Crear producto |
| `/admin/products/[id]` | Editar producto |
| `/admin/categories` | Gestión de categorías |
| `/admin/orders` | Gestión de órdenes |
| `/admin/orders/[id]` | Detalle de orden (admin) |
| `/admin/users` | Gestión de usuarios |
| `/admin/users/[id]` | Detalle de usuario |
| `/admin/profile` | Perfil del administrador |

---

## Vistas Públicas (Auth)

### Login (`/login`)
**Layout**: `auth-layout`
**Página**: `login-page`

#### Componente: LoginForm
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `login-form` | form | Formulario completo de login |
| `login-form-email` | InputText | Campo de email |
| `login-form-email-error` | small | Mensaje de error del email |
| `login-form-password` | Password | Campo de contraseña |
| `login-form-password-error` | small | Mensaje de error de contraseña |
| `login-form-remember` | Checkbox | Checkbox "Recordarme" |
| `login-form-forgot-password-link` | Link | Enlace a recuperar contraseña |
| `login-form-submit` | Button | Botón de envío |
| `login-form-server-error` | Message | Error del servidor |

**Ejemplo Playwright:**
```typescript
await page.goto('/login');
await page.getByTestId('login-form-email').fill('admin@sonirama.com');
await page.getByTestId('login-form-password').fill('Admin123!');
await page.getByTestId('login-form-submit').click();
```

### Recuperar Contraseña (`/forgot-password`)
**Layout**: `auth-layout`

#### Componente: ForgotPasswordForm
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `forgot-password-form-email-step` | div | Paso 1: Ingresar email |
| `forgot-password-form-email` | InputText | Campo de email |
| `forgot-password-form-email-error` | small | Error del email |
| `forgot-password-form-email-submit` | Button | Enviar código |
| `forgot-password-form-code-step` | div | Paso 2: Ingresar código |
| `forgot-password-form-code` | InputText | Campo de código |
| `forgot-password-form-code-error` | small | Error del código |
| `forgot-password-form-code-back` | Button | Volver |
| `forgot-password-form-code-submit` | Button | Verificar código |
| `forgot-password-form-success-step` | div | Paso 3: Éxito |
| `forgot-password-form-server-error` | Message | Error del servidor |

### Contacto (`/contact`)

#### Componente: ContactForm
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `contact-form` | form | Formulario completo |
| `contact-form-name` | InputText | Campo nombre |
| `contact-form-name-error` | small | Error del nombre |
| `contact-form-email` | InputText | Campo email |
| `contact-form-email-error` | small | Error del email |
| `contact-form-subject` | InputText | Campo asunto |
| `contact-form-subject-error` | small | Error del asunto |
| `contact-form-message` | InputTextarea | Campo mensaje |
| `contact-form-message-error` | small | Error del mensaje |
| `contact-form-submit` | Button | Enviar mensaje |
| `contact-form-success` | div | Estado de éxito |
| `contact-form-send-another` | Button | Enviar otro mensaje |

---

## Vistas de Usuario (Dashboard)

### Layout Dashboard
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `dashboard-layout` | div | Contenedor principal |
| `dashboard-navbar` | nav | Barra de navegación |
| `dashboard-main` | main | Contenido principal |
| `dashboard-footer` | footer | Pie de página |
| `dashboard-guard` | - | AuthGuard wrapper |

### Navbar (Usuario)
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `dashboard-navbar` | nav | Contenedor navbar |
| `dashboard-navbar-logo` | Link | Logo clickeable |
| `dashboard-navbar-cart` | Link | Icono carrito |
| `dashboard-navbar-cart-badge` | Badge | Cantidad en carrito |
| `dashboard-navbar-notifications` | NotificationBell | Campana de notificaciones |
| `dashboard-navbar-theme-toggle` | Button | Toggle tema claro/oscuro |
| `dashboard-navbar-user-menu` | Menu | Menú de usuario |
| `dashboard-navbar-user-menu-popup` | Menu | Popup del menú |
| `dashboard-navbar-user-avatar` | Avatar | Avatar del usuario |

### Catálogo de Productos (`/products`)

#### Componente: ProductFilters (Sidebar overlay)
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `product-filters` | Sidebar | Panel de filtros |
| `product-filters-search` | InputText | Búsqueda por nombre |
| `product-filters-category` | Dropdown | Filtro por categoría |
| `product-filters-min-price` | InputNumber | Precio mínimo |
| `product-filters-max-price` | InputNumber | Precio máximo |
| `product-filters-apply` | Button | Aplicar filtros |
| `product-filters-clear` | Button | Limpiar filtros |

#### Componente: ProductsGrid
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `products-grid` | div | Contenedor de productos |
| `products-grid-count` | span | Cantidad de productos |
| `products-grid-items` | div | Grid de tarjetas |
| `products-grid-loading` | div | Estado de carga |
| `products-grid-loading-more` | div | Cargando más productos |
| `products-grid-empty` | EmptyState | Sin productos |
| `products-grid-error` | EmptyState | Error al cargar |

#### Componente: ProductCard (repetido por producto)
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `product-card-{productId}` | Card | Tarjeta de producto |
| `product-card-{productId}-name` | h3 | Nombre del producto |
| `product-card-{productId}-price` | span | Precio |
| `product-card-{productId}-category` | Tag | Categoría |
| `product-card-{productId}-bulk-discount` | Tag | Tag de descuento mayorista |
| `product-card-{productId}-add-to-cart` | Button | Agregar al carrito |

### Detalle de Producto (`/products/[id]`)

#### Componente: ProductDetail
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `product-detail` | div | Contenedor principal |
| `product-detail-back` | Button | Volver al catálogo |
| `product-detail-gallery` | Galleria | Galería de imágenes |
| `product-detail-name` | h1 | Nombre del producto |
| `product-detail-price` | span | Precio |
| `product-detail-category` | Tag | Categoría |
| `product-detail-description` | p | Descripción |
| `product-detail-quantity` | InputNumber | Selector de cantidad |
| `product-detail-add-to-cart` | Button | Agregar al carrito |
| `product-detail-loading` | div | Estado de carga |
| `product-detail-error` | EmptyState | Error al cargar |

### Carrito (`/cart`)

#### Componente: CartView
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `cart-view` | div | Contenedor principal |
| `cart-view-items` | div | Lista de items |
| `cart-view-summary` | Card | Resumen del carrito |
| `cart-view-total` | span | Total a pagar |
| `cart-view-checkout` | Button | Finalizar compra |
| `cart-view-continue-shopping` | Button | Seguir comprando |
| `cart-view-clear` | Button | Vaciar carrito |
| `cart-view-loading` | div | Estado de carga |
| `cart-view-empty` | EmptyState | Carrito vacío |

#### Componente: CartItemCard (repetido por item)
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `cart-item-{productId}` | div | Item del carrito |
| `cart-item-{productId}-name` | span | Nombre del producto |
| `cart-item-{productId}-code` | span | Código del producto |
| `cart-item-{productId}-unit-price` | span | Precio unitario |
| `cart-item-{productId}-quantity` | InputNumber | Cantidad |
| `cart-item-{productId}-subtotal` | span | Subtotal del item |
| `cart-item-{productId}-remove` | Button | Eliminar item |

### Órdenes (`/orders`)

#### Componente: OrdersList
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `orders-list` | div | Lista de órdenes |
| `orders-list-loading` | div | Estado de carga |
| `orders-list-empty` | EmptyState | Sin órdenes |
| `orders-list-error` | EmptyState | Error al cargar |
| `orders-list-order-{orderId}-number` | Link | Número de orden |
| `orders-list-order-{orderId}-date` | span | Fecha de orden |
| `orders-list-order-{orderId}-total` | span | Total de la orden |
| `orders-list-order-{orderId}-status` | Tag | Estado de la orden |
| `orders-list-order-{orderId}-view` | Button | Ver detalle |

### Detalle de Orden (`/orders/[id]`)

#### Componente: OrderDetail
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `order-detail` | div | Contenedor principal |
| `order-detail-back` | Button | Volver a órdenes |
| `order-detail-number` | span | Número de orden |
| `order-detail-date` | span | Fecha |
| `order-detail-status` | Tag | Estado |
| `order-detail-items-card` | Card | Tarjeta de items |
| `order-detail-timeline-card` | Card | Timeline de estados |
| `order-detail-summary` | Card | Resumen de totales |
| `order-detail-subtotal` | span | Subtotal |
| `order-detail-discount` | span | Descuento (si aplica) |
| `order-detail-total` | span | Total |
| `order-detail-loading` | div | Estado de carga |
| `order-detail-error` | EmptyState | Error al cargar |
| `order-detail-item-{productId}` | div | Item de la orden |
| `order-detail-item-{productId}-name` | h4 | Nombre producto |
| `order-detail-item-{productId}-quantity` | span | Cantidad |
| `order-detail-item-{productId}-price` | span | Precio |
| `order-detail-item-{productId}-subtotal` | span | Subtotal |

### Notificaciones (`/notifications`)

#### Componente: NotificationsList
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `notifications-list` | div | Lista de notificaciones |
| `notifications-list-mark-all-read` | Button | Marcar todas como leídas |
| `notifications-list-loading` | div | Estado de carga |
| `notifications-list-empty` | EmptyState | Sin notificaciones |

### Perfil (`/profile`)

#### Componente: ProfileView
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `profile-view` | div | Contenedor principal |
| `profile-view-info` | Card | Información personal |
| `profile-view-firstName` | InputText | Campo nombre |
| `profile-view-lastName` | InputText | Campo apellido |
| `profile-view-phone` | InputText | Campo teléfono |
| `profile-view-email-value` | span | Email (solo lectura) |
| `profile-view-name-value` | span | Nombre completo (modo vista) |
| `profile-view-phone-value` | span | Teléfono (modo vista) |
| `profile-view-edit` | Button | Editar perfil |
| `profile-view-password` | Card | Cambiar contraseña |
| `profile-view-currentPassword` | Password | Contraseña actual |
| `profile-view-newPassword` | Password | Nueva contraseña |
| `profile-view-confirmNewPassword` | Password | Confirmar contraseña |
| `profile-view-change-password` | Button | Cambiar contraseña |
| `profile-view-loading` | div | Estado de carga |

---

## Vistas de Administrador (Admin)

### Layout Admin
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `admin-layout` | div | Contenedor principal |
| `admin-navbar` | nav | Barra de navegación |
| `admin-sidebar` | aside | Sidebar de navegación |
| `admin-main` | main | Contenido principal |
| `admin-footer` | footer | Pie de página |
| `admin-guard` | - | AuthGuard (rol ADMIN) |

### AdminSidebar
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `admin-sidebar` | aside | Sidebar contenedor |
| `admin-sidebar-menu` | Menu | Menú de navegación |

**Items del menú (PrimeReact Menu):**
- Productos → `/admin/products`
- Categorías → `/admin/categories`
- Órdenes → `/admin/orders`
- Usuarios → `/admin/users`

### Productos Admin (`/admin/products`)

#### Componente: AdminProductsTable
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `admin-products-table` | div | Contenedor |
| `admin-products-table-search` | InputText | Búsqueda |
| `admin-products-table-create` | Button | Crear producto |
| `admin-products-table-loading` | div | Estado de carga |
| `admin-products-table-empty` | EmptyState | Sin productos |
| `admin-products-table-error` | EmptyState | Error |
| `admin-products-table-product-{id}-name` | span | Nombre |
| `admin-products-table-product-{id}-category` | span | Categoría |
| `admin-products-table-product-{id}-price` | span | Precio |
| `admin-products-table-product-{id}-status` | Tag | Estado (activo/inactivo) |
| `admin-products-table-product-{id}-edit` | Button | Editar |

### Editor de Producto (`/admin/products/[id]` o `/admin/products/new`)

#### Componente: ProductEditor
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `product-editor` | Card | Formulario de edición |
| `product-editor-name` | InputText | Nombre |
| `product-editor-description` | InputTextarea | Descripción |
| `product-editor-price` | InputNumber | Precio |
| `product-editor-category` | Dropdown | Categoría |
| `product-editor-isActive` | Checkbox | Producto activo |
| `product-editor-submit` | Button | Guardar |
| `product-editor-error` | EmptyState | Error |

### Categorías Admin (`/admin/categories`)

#### Componente: AdminCategoriesTable
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `admin-categories-table` | div | Contenedor |
| `admin-categories-table-create` | Button | Nueva categoría |
| `admin-categories-table-empty` | EmptyState | Sin categorías |
| `admin-categories-table-error` | EmptyState | Error |

### Órdenes Admin (`/admin/orders`)

#### Componente: AdminOrdersTable
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `admin-orders-table` | div | Contenedor |
| `admin-orders-table-empty` | EmptyState | Sin órdenes |
| `admin-orders-table-error` | EmptyState | Error |

### Detalle Orden Admin (`/admin/orders/[id]`)

#### Componente: AdminOrderDetail
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `admin-order-detail` | div | Contenedor |
| `admin-order-detail-error` | EmptyState | Error |

### Usuarios Admin (`/admin/users`)

#### Componente: AdminUsersTable
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `admin-users-table` | div | Contenedor |
| `admin-users-table-empty` | EmptyState | Sin usuarios |
| `admin-users-table-error` | EmptyState | Error |

### Detalle Usuario Admin (`/admin/users/[id]`)

#### Componente: AdminUserDetail
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `admin-user-detail` | div | Contenedor |
| `admin-user-detail-error` | EmptyState | Error |

### Perfil Admin (`/admin/profile`)
Usa el mismo componente `ProfileView` con prefix `admin-profile-view`.

---

## Componentes Compartidos

### NotificationBell (en Navbar)
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `{prefix}-notifications` | Button | Botón campana |
| `{prefix}-notifications-badge` | Badge | Contador no leídas |
| `{prefix}-notifications-panel` | OverlayPanel | Panel desplegable |
| `{prefix}-notifications-mark-all-read` | Button | Marcar todas leídas |
| `{prefix}-notifications-list` | div | Lista de notificaciones |
| `{prefix}-notifications-empty` | div | Sin notificaciones |
| `{prefix}-notifications-item-{id}` | div | Item de notificación |
| `{prefix}-notifications-item-{id}-unread` | span | Indicador no leída |
| `{prefix}-notifications-view-all` | Link | Ver todas |

### Footer
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `{prefix}-footer` | footer | Pie de página |
| `{prefix}-footer-copyright` | span | Copyright |
| `{prefix}-footer-contact-link` | Link | Enlace a contacto |

---

## Componentes UI Reutilizables

### Logo
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `logo` | div | Contenedor |
| `logo-image` | Image | Imagen del logo |
| `logo-text` | span | Texto "Sonirama" |
| `logo-link` | Link | Enlace al home |

### ThemeToggle
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `theme-toggle` | Button | Botón toggle tema |

### LoadingSpinner
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `loading-spinner` | div | Contenedor |
| `loading-spinner-message` | p | Mensaje de carga |
| `loading-spinner-overlay` | div | Overlay de carga |

### EmptyState
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `{customId}` | div | Contenedor |
| `{customId}-icon` | i | Icono |
| `{customId}-title` | h3 | Título |
| `{customId}-description` | p | Descripción |
| `{customId}-action` | Button | Botón de acción |

### GlobalToast
| Test ID | Tipo | Descripción |
|---------|------|-------------|
| `global-toast` | Toast | Contenedor de toasts |

---

## Flujos de Prueba Sugeridos

### 1. Flujo de Usuario Regular

```typescript
// test/e2e/user-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login como usuario
    await page.goto('/login');
    await page.getByTestId('login-form-email').fill('user@example.com');
    await page.getByTestId('login-form-password').fill('UserPassword123!');
    await page.getByTestId('login-form-submit').click();
    await expect(page).toHaveURL('/products');
  });

  test('should browse products and add to cart', async ({ page }) => {
    // Ver catálogo
    await expect(page.getByTestId('products-grid')).toBeVisible();
    
    // Abrir filtros y buscar
    await page.getByTestId('product-filters-search').fill('Disco');
    await page.getByTestId('product-filters-apply').click();
    
    // Agregar producto al carrito
    const firstProduct = page.getByTestId(/^product-card-/).first();
    await firstProduct.getByTestId(/add-to-cart$/).click();
    
    // Verificar badge del carrito
    await expect(page.getByTestId('dashboard-navbar-cart-badge')).toHaveText('1');
  });

  test('should complete checkout', async ({ page }) => {
    // Ir al carrito
    await page.getByTestId('dashboard-navbar-cart').click();
    await expect(page).toHaveURL('/cart');
    
    // Verificar items
    await expect(page.getByTestId('cart-view-items')).toBeVisible();
    
    // Finalizar compra
    await page.getByTestId('cart-view-checkout').click();
    
    // Debería crear una orden y redirigir
    await expect(page).toHaveURL(/\/orders\/[a-z0-9-]+/);
  });

  test('should view order history', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByTestId('orders-list')).toBeVisible();
  });

  test('should update profile', async ({ page }) => {
    await page.goto('/profile');
    await page.getByTestId('profile-view-edit').click();
    await page.getByTestId('profile-view-firstName').fill('Juan');
    await page.getByTestId('profile-view-lastName').fill('Pérez');
    // Guardar cambios...
  });
});
```

### 2. Flujo de Administrador

```typescript
// test/e2e/admin-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.getByTestId('login-form-email').fill('admin@sonirama.com');
    await page.getByTestId('login-form-password').fill('Admin123!');
    await page.getByTestId('login-form-submit').click();
    await expect(page).toHaveURL('/admin/products');
  });

  test('should manage products', async ({ page }) => {
    // Ver tabla de productos
    await expect(page.getByTestId('admin-products-table')).toBeVisible();
    
    // Crear nuevo producto
    await page.getByTestId('admin-products-table-create').click();
    await expect(page).toHaveURL('/admin/products/new');
    
    // Llenar formulario
    await page.getByTestId('product-editor-name').fill('Nuevo Disco de Vinilo');
    await page.getByTestId('product-editor-description').fill('Descripción del producto');
    await page.getByTestId('product-editor-price').fill('1500');
    await page.getByTestId('product-editor-category').click();
    // Seleccionar categoría...
    
    await page.getByTestId('product-editor-submit').click();
    
    // Volver a la tabla
    await expect(page).toHaveURL('/admin/products');
  });

  test('should view and manage orders', async ({ page }) => {
    // Navegar via sidebar
    await page.getByTestId('admin-sidebar-menu').getByText('Órdenes').click();
    await expect(page).toHaveURL('/admin/orders');
    
    await expect(page.getByTestId('admin-orders-table')).toBeVisible();
  });

  test('should manage users', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByTestId('admin-users-table')).toBeVisible();
  });

  test('should manage categories', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.getByTestId('admin-categories-table')).toBeVisible();
    
    // Crear categoría
    await page.getByTestId('admin-categories-table-create').click();
    // Completar formulario en dialog...
  });
});
```

### 3. Flujo de Autenticación

```typescript
// test/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByTestId('login-form-email').fill('admin@sonirama.com');
    await page.getByTestId('login-form-password').fill('Admin123!');
    await page.getByTestId('login-form-submit').click();
    
    await expect(page).toHaveURL('/admin/products');
    await expect(page.getByTestId('admin-navbar-user-avatar')).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByTestId('login-form-submit').click();
    
    await expect(page.getByTestId('login-form-email-error')).toBeVisible();
    await expect(page.getByTestId('login-form-password-error')).toBeVisible();
  });

  test('should handle login error', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByTestId('login-form-email').fill('wrong@email.com');
    await page.getByTestId('login-form-password').fill('wrongpassword');
    await page.getByTestId('login-form-submit').click();
    
    await expect(page.getByTestId('login-form-server-error')).toBeVisible();
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByTestId('login-form-forgot-password-link').click();
    
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.getByTestId('forgot-password-form-email-step')).toBeVisible();
  });

  test('should logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByTestId('login-form-email').fill('admin@sonirama.com');
    await page.getByTestId('login-form-password').fill('Admin123!');
    await page.getByTestId('login-form-submit').click();
    
    // Open user menu and logout
    await page.getByTestId('admin-navbar-user-menu').click();
    await page.getByText('Cerrar sesión').click();
    
    await expect(page).toHaveURL('/login');
  });
});
```

### 4. Helpers Útiles

```typescript
// test/e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-form-email').fill('admin@sonirama.com');
  await page.getByTestId('login-form-password').fill('Admin123!');
  await page.getByTestId('login-form-submit').click();
  await page.waitForURL('/admin/products');
}

export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-form-email').fill(email);
  await page.getByTestId('login-form-password').fill(password);
  await page.getByTestId('login-form-submit').click();
  await page.waitForURL('/products');
}

export async function logout(page: Page) {
  const userMenu = page.getByTestId(/navbar-user-menu$/);
  await userMenu.click();
  await page.getByText('Cerrar sesión').click();
  await page.waitForURL('/login');
}
```

---

## Notas Importantes

1. **Test IDs dinámicos**: Algunos test IDs incluyen IDs de entidades (ej: `product-card-{productId}`). Usa expresiones regulares o selectores parciales.

2. **PrimeReact Components**: Algunos componentes de PrimeReact (Dialog, Dropdown, etc.) generan elementos fuera del DOM principal. Puede necesitarse `page.locator()` en lugar de `getByTestId()`.

3. **Estados de carga**: La mayoría de componentes tienen estados `*-loading` para esperar antes de interactuar.

4. **Toasts**: Los mensajes de éxito/error aparecen en `global-toast`. Verificar con:
   ```typescript
   await expect(page.getByTestId('global-toast')).toContainText('mensaje');
   ```

5. **Autenticación persistente**: Los tokens se guardan en localStorage. Para tests independientes, limpiar storage entre tests.

6. **API Mock**: Para tests más rápidos, considera usar Playwright's route interception para mockear respuestas de la API.
