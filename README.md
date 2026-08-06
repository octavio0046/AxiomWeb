# AxiomWeb

Frontend POS (punto de venta) de Axiom, construido con **Angular 21** y **Bootstrap 5**.

## Requisitos

- Node.js + npm
- API Axiom corriendo en `http://localhost:3000` (AxiomApi)

## Cómo ejecutar

```bash
cd AxiomWeb
npm install
npm start
```

La app queda en [http://localhost:4200](http://localhost:4200).

Equivalente:

```bash
ng serve
```

## Credenciales de demo

Crear o actualizar en API: `node scripts/seed-demo-users.js` (desde `AxiomApi`)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Administrador |
| `vendedor` | `test123` | Vendedor |
| `supervisor` | `test123` | Supervisor |
| `comprador` | `test123` | Comprador |

## Módulos

- Productos, Clientes, Ventas, Nueva venta
- **Usuarios**: crear, editar, activar/desactivar y asignar roles (`/users`)
- **Proveedores** (`/suppliers`) y **Compras** (`/purchases`, `/purchases/new`): ingreso de stock
- Las ventas validan existencias (excepto servicios) y descuentan stock

## Inventario

1. Compra → suma stock del producto  
2. Venta → resta stock si hay existencias  
3. Sin stock → no permite vender

## Reportes

Menú **Reportes** (`/reports`) con 3 paneles:

1. **Ventas del período** — totales, ventas por día y productos más vendidos  
2. **Inventario actual** — stock, valor y alertas (sin stock / bajo)  
3. **Compras a proveedores** — totales, por proveedor y listado reciente  

Cada pestaña se muestra según permisos del usuario.

## Recibo de venta

- Ruta: `/sales/:id/recibo`
- Formato de impresión: **hoja carta** (8.5" × 11"), recibo solo en la **mitad superior**
- Al completar una venta se abre el recibo; también desde **Ventas → Recibo**
- Usa **Imprimir recibo** con tamaño de papel **Carta / Letter**

## API

- Base URL: `http://localhost:3000/api` (ver `src/environments/environment.ts`)
- Auth: `POST /auth/login` → token Bearer en `Authorization`

## UI

La interfaz usa solo clases de **Bootstrap 5** y **bootstrap-icons**. No hay CSS/SCSS de diseño personalizado; `styles.scss` solo importa Bootstrap y los iconos.
