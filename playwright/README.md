# Sonirama E2E Tests con Playwright

Este directorio contiene la suite de tests end-to-end para validar el frontend y backend de Sonirama funcionando en conjunto.

## 📁 Estructura

```
playwright/
├── tests/                    # Tests E2E
│   ├── auth.spec.ts         # Tests de autenticación
│   ├── categories.spec.ts   # Tests CRUD de categorías
│   ├── products.spec.ts     # Tests CRUD de productos
│   ├── orders.spec.ts       # Tests del flujo de órdenes
│   ├── websocket.spec.ts    # Tests de notificaciones en tiempo real
│   └── full-flow.spec.ts    # Test completo del flujo E2E
├── helpers/                  # Utilidades y helpers
│   ├── auth.ts              # Helper de autenticación
│   ├── products.ts          # Helper de productos
│   ├── categories.ts        # Helper de categorías
│   ├── cart.ts              # Helper de carrito
│   ├── orders.ts            # Helper de órdenes
│   ├── notifications.ts     # Helper de notificaciones/WebSocket
│   └── index.ts             # Re-exporta todos los helpers
├── test_images/              # Imágenes de prueba para upload
│   ├── test_1.jpg
│   ├── test_2.jpg
│   └── test_3.jpg
├── playwright.config.ts      # Configuración de Playwright
├── global-setup.ts          # Setup global antes de todos los tests
├── global-teardown.ts       # Teardown después de todos los tests
├── package.json             # Dependencias del proyecto
├── tsconfig.json            # Configuración de TypeScript
└── README.md                # Este archivo
```

## 🚀 Instalación

```bash
cd playwright
npm install
npm run install:browsers
```

## ⚙️ Configuración

1. Copia el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env
```

2. Edita `.env` con tus configuraciones:
```env
FRONTEND_URL=http://localhost:3000
API_URL=https://localhost:5001
ADMIN_EMAIL=admin@sonirama.com
ADMIN_PASSWORD=Admin123!
```

## 🧪 Ejecución de Tests

### Prerequisitos

Antes de ejecutar los tests, asegúrate de que:
1. La base de datos está corriendo (Docker Compose)
2. El backend está corriendo (`dotnet run` en Sonirama.Api)
3. El frontend está corriendo (`npm run dev` en webapp)

### Comandos

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con interfaz visual
npm run test:ui

# Ejecutar en modo headed (ver el navegador)
npm run test:headed

# Ejecutar en modo debug
npm run test:debug

# Ejecutar tests específicos
npm run test:products      # Solo tests de productos
npm run test:categories    # Solo tests de categorías
npm run test:orders        # Solo tests de órdenes
npm run test:full-flow     # Solo el flujo completo E2E

# Ver el reporte HTML
npm run test:report
```

## 📋 Descripción de los Tests

### `auth.spec.ts`
Tests de autenticación:
- Login con credenciales válidas
- Validación de formulario de login
- Error con credenciales inválidas
- Logout
- Protección de rutas
- Recuperación de contraseña

### `categories.spec.ts`
Tests CRUD de categorías:
- Crear categoría
- Listar categorías
- Actualizar categoría
- Eliminar categoría
- Validaciones

### `products.spec.ts`
Tests CRUD de productos:
- Crear producto
- Subir imágenes
- Actualizar producto
- Ver producto en catálogo
- Activar/desactivar producto
- Eliminar producto
- Validaciones

### `orders.spec.ts`
Tests del flujo de órdenes:
- Ver catálogo
- Agregar al carrito
- Modificar carrito
- Checkout
- Flujo completo de orden (approve → confirm → ready → complete)
- Cancelación de orden
- Rechazo de orden

### `websocket.spec.ts`
Tests de notificaciones en tiempo real:
- Badge de notificaciones
- Panel de notificaciones
- Marcar como leído
- Notificaciones en tiempo real
- Conexión SignalR

### `full-flow.spec.ts` ⭐
**El test más importante** - Valida todo el sistema:
1. **Setup**: Crear categoría y producto, subir imágenes
2. **Shopping**: Ver catálogo, buscar, agregar al carrito, checkout
3. **Admin**: Aprobar, confirmar, marcar listo, completar orden
4. **Update**: Actualizar producto, verificar cambios
5. **Notifications**: Verificar sistema de notificaciones
6. **Cleanup**: Eliminar datos de prueba

## 🔧 Helpers

### AuthHelper
```typescript
const auth = new AuthHelper(page);
await auth.loginAsAdmin();
await auth.logout();
```

### ProductHelper
```typescript
const productHelper = new ProductHelper(page);
const productId = await productHelper.createProduct(data);
await productHelper.updateProduct(productId, updates);
await productHelper.deleteProduct(productId);
```

### CategoryHelper
```typescript
const categoryHelper = new CategoryHelper(page);
const categoryId = await categoryHelper.createCategory(data);
await categoryHelper.updateCategory(categoryId, updates);
await categoryHelper.deleteCategory(categoryId);
```

### CartHelper
```typescript
const cartHelper = new CartHelper(page);
await cartHelper.addProductToCart(productId, quantity);
await cartHelper.updateItemQuantity(productId, newQuantity);
const orderId = await cartHelper.checkout();
```

### OrderHelper
```typescript
const orderHelper = new OrderHelper(page);
await orderHelper.approveOrder(orderId);
await orderHelper.confirmOrder(orderId);
await orderHelper.completeOrder(orderId);
```

### NotificationHelper
```typescript
const notificationHelper = new NotificationHelper(page);
await notificationHelper.openNotificationsPanel(true);
await notificationHelper.markAllAsRead(true);
```

## 🎯 Flujo de Test Recomendado

Para desarrollo diario, ejecuta tests específicos:
```bash
npm run test:products  # Si trabajas en productos
npm run test:orders    # Si trabajas en órdenes
```

Antes de hacer commit, ejecuta el flujo completo:
```bash
npm run test:full-flow
```

Para CI/CD, ejecuta todos los tests:
```bash
npm test
```

## 🐛 Debugging

### Ver qué hace el test
```bash
npm run test:headed  # Muestra el navegador
```

### Pausar en un punto
```typescript
await page.pause();  // Agrega esto en tu test
```

### Screenshots y videos
Los tests fallos generan automáticamente:
- Screenshots en `test-results/`
- Videos en `test-results/`
- Traces en `test-results/`

Para ver el trace:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## 📊 Reportes

Después de ejecutar tests, abre el reporte HTML:
```bash
npm run test:report
```

El reporte incluye:
- Resumen de tests pasados/fallados
- Screenshots de errores
- Videos de ejecución
- Traces interactivos

## 🔄 WebSockets / SignalR

Para testear interacciones en tiempo real entre admin y usuario:

1. Los tests en `websocket.spec.ts` usan dos browser contexts
2. Un contexto actúa como admin (observando notificaciones)
3. Otro contexto actúa como usuario (realizando acciones)
4. Se verifica que las notificaciones lleguen en tiempo real

```typescript
test('Admin receives notification when order is created', async ({ browser }) => {
  const adminContext = await browser.newContext();
  const userContext = await browser.newContext();
  
  const adminPage = await adminContext.newPage();
  const userPage = await userContext.newPage();
  
  // Admin se loguea y espera notificaciones
  // User crea una orden
  // Verificar que admin recibió la notificación
});
```

## 📝 Notas Importantes

1. **Limpieza de datos**: Los tests crean datos con un ID único basado en timestamp (`e2e_${Date.now()}`). Al final de cada suite, los datos son eliminados.

2. **Orden de ejecución**: Los tests de `full-flow.spec.ts` usan `test.describe.serial()` para ejecutarse en orden.

3. **Test IDs**: Los componentes del frontend tienen `data-testid` attributes. Ver `PLAYWRIGHT_TEST_IDS.md` en el directorio `webapp`.

4. **Timeouts**: Los timeouts están configurados generosamente para dar tiempo a las operaciones de red.

5. **Manejo de errores**: Los helpers tienen `.catch()` para manejar elementos opcionales sin fallar el test.

## 🤝 Contribuir

Al agregar nuevos tests:
1. Usa los helpers existentes cuando sea posible
2. Agrega `data-testid` a nuevos elementos del frontend
3. Documenta nuevos test IDs en `PLAYWRIGHT_TEST_IDS.md`
4. Asegúrate de limpiar los datos creados
