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

- Usuario: `admin`
- Contraseña: `admin123`

## Módulos

- Productos, Clientes, Ventas, Nueva venta
- **Usuarios**: crear, editar, activar/desactivar y asignar roles (`/users`)
- **Proveedores** (`/suppliers`) y **Compras** (`/purchases`, `/purchases/new`): ingreso de stock
- Las ventas validan existencias (excepto servicios) y descuentan stock

## Inventario

1. Compra → suma stock del producto  
2. Venta → resta stock si hay existencias  
3. Sin stock → no permite vender

## API

- Base URL: `http://localhost:3000/api` (ver `src/environments/environment.ts`)
- Auth: `POST /auth/login` → token Bearer en `Authorization`

## UI

La interfaz usa solo clases de **Bootstrap 5** y **bootstrap-icons**. No hay CSS/SCSS de diseño personalizado; `styles.scss` solo importa Bootstrap y los iconos.
