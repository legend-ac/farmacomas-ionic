# Farmacomas Control Ionic

Aplicacion movil academica creada con Ionic, Angular y TypeScript.

## Tecnologias usadas

- Ionic Framework
- Angular
- TypeScript
- Firebase Web SDK
- Capacitor
- Cloud Firestore para sincronizacion
- LocalStorage para respaldo local

## Funciones incluidas

- Resumen de medicamentos, pedidos pendientes, alertas de stock y valor de inventario.
- Registro y listado de medicamentos.
- Registro y listado de clientes.
- Creacion de pedidos con descuento automatico del stock.
- Marcado de pedidos como entregados.
- Persistencia local de datos en el navegador.
- Sincronizacion con Firebase Cloud Firestore.

## Documento base

El objetivo, la problematica y el modelo Firebase del proyecto estan en:

```text
docs/objetivo-problematica-firebase.md
```

## Comandos

```bash
npm install
npm start
npm run build
npm run serve:dist
```

Para desarrollo usa `npm start`. Para entregar o probar la version compilada usa:

```bash
npm run build
npm run serve:dist
```

La app se abre en:

```text
http://127.0.0.1:8100
```
