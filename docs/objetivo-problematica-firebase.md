# Farmacomas - objetivo, problematica y conexion Firebase

## Titulo del proyecto

Aplicacion movil para el control de stock en tiempo real, digitalizacion de pedidos y alertas de reposicion de medicamentos criticos en boticas del distrito de Comas.

## Realidad problematica

Las boticas pequenas del distrito de Comas suelen administrar medicamentos, clientes y pedidos con registros manuales, hojas de calculo o conversaciones dispersas por telefono y WhatsApp. Esto dificulta conocer el stock real, provoca demoras en la atencion, aumenta el riesgo de quiebre de medicamentos criticos y reduce la trazabilidad de los pedidos.

## Objetivo general

Implementar una aplicacion movil con Ionic, Angular y TypeScript que permita gestionar inventario, clientes y pedidos, mostrando alertas de reposicion y sincronizando la informacion principal con Firebase Cloud Firestore.

## Objetivos especificos

- Registrar medicamentos con categoria, stock actual, stock minimo y precio.
- Identificar medicamentos que requieren reposicion.
- Registrar clientes para asociarlos a pedidos.
- Crear pedidos y descontar automaticamente el stock.
- Guardar informacion localmente para mantener uso basico sin conexion.
- Sincronizar medicamentos, clientes y pedidos con Firebase Cloud Firestore.

## Tecnologias aceptadas del proyecto actual

- Ionic Framework para componentes moviles.
- Angular para estructura de aplicacion, plantillas y enlace de datos.
- TypeScript para modelos, logica de negocio y servicios.
- Firebase Web SDK para conexion con Cloud Firestore.
- LocalStorage como respaldo local cuando Firebase no esta disponible.

## Proyecto Firebase usado

```text
projectId: andy-legend-01
authDomain: andy-legend-01.firebaseapp.com
storageBucket: andy-legend-01.firebasestorage.app
messagingSenderId: 542477025592
webAppId: 1:542477025592:web:08de17cd6d69de491e81cd
```

## Colecciones Firestore

### medicamentos

```text
medicamentos/{id}
  nombre
  categoria
  stockActual
  stockMinimo
  precioVenta
  actualizadoEn
```

### clientes

```text
clientes/{id}
  nombre
  telefono
  direccion
  creadoEn
```

### pedidos

```text
pedidos/{id}
  clienteNombre
  medicamentoNombre
  cantidad
  estado
  creadoEn
```

## Funciones obligatorias cubiertas

- Registrar medicamentos.
- Ver inventario completo.
- Controlar stock actual y stock minimo.
- Mostrar alertas de medicamentos con bajo stock.
- Registrar clientes.
- Crear pedidos asociados a cliente y medicamento.
- Descontar automaticamente el stock cuando se genera un pedido.
- Marcar pedidos como entregados.
- Eliminar medicamentos, clientes y pedidos.
- Guardar datos localmente con LocalStorage.
- Sincronizar datos con Firebase Cloud Firestore cuando las reglas lo permitan.
- Mostrar resumen general de medicamentos, pedidos pendientes, alertas y valor de inventario.

## Criterio de funcionamiento

La aplicacion intenta leer datos desde Firebase al iniciar. Si Firebase responde, actualiza la vista con los datos remotos y tambien guarda una copia local. Si Firebase no responde por falta de internet o reglas de seguridad, la app sigue funcionando en modo local y muestra el estado en pantalla.

## Archivos principales

```text
src/environments/environment.ts
src/environments/environment.prod.ts
src/app/services/firebase-data.service.ts
src/app/core/models.ts
src/app/home/home.page.ts
src/app/home/home.page.html
src/app/home/home.page.scss
firestore.rules
firebase.json
vercel.json
capacitor.config.ts
```

## Comandos de verificacion

```bash
npm install
npm run lint
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
npm run serve:dist
```

## Datos externos necesarios

Para dejar Firebase al 100% en modo nube, la cuenta usada por Firebase CLI debe tener acceso al proyecto `andy-legend-01`. Actualmente la app tiene la configuracion web de Firebase, pero Firestore rechaza escrituras si las reglas del proyecto no permiten acceso.

Acciones necesarias en Firebase Console:

1. Agregar la cuenta de desarrollo como Owner, Editor o Firebase Admin del proyecto `andy-legend-01`.
2. Habilitar Cloud Firestore.
3. Publicar las reglas de `firestore.rules` con:

```bash
firebase login
firebase use andy-legend-01
firebase deploy --only firestore:rules
```

Para generar APK en Android se necesita:

1. Instalar Android Studio con Android SDK.
2. Tener `adb` disponible en PATH.
3. Instalar dependencias Capacitor:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android --save
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

Luego, en Android Studio:

```text
Build > Build Bundle(s) / APK(s) > Build APK(s)
```
