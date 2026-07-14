# Farmacomas Control

Sistema movil para gestion farmaceutica, control de inventario, ventas, clientes, proveedores y sincronizacion en la nube.

> README preparado para exposicion academica. El documento explica el proyecto completo sin mostrar codigo fuente interno. Solo se incluyen comandos necesarios, rutas de referencia y decisiones tecnicas importantes.

## Indice

- [Resumen del proyecto](#resumen-del-proyecto)
- [Problematica](#problematica)
- [Objetivos](#objetivos)
- [Usuarios beneficiados](#usuarios-beneficiados)
- [Alcance funcional](#alcance-funcional)
- [Modulos del sistema](#modulos-del-sistema)
- [Flujos principales](#flujos-principales)
- [Arquitectura general](#arquitectura-general)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Modelo de datos](#modelo-de-datos)
- [Firebase y seguridad](#firebase-y-seguridad)
- [Modo offline y sincronizacion](#modo-offline-y-sincronizacion)
- [Aplicacion Android](#aplicacion-android)
- [Instalacion y ejecucion](#instalacion-y-ejecucion)
- [Comandos utiles](#comandos-utiles)
- [Como exponer el proyecto](#como-exponer-el-proyecto)
- [Limitaciones y mejoras futuras](#limitaciones-y-mejoras-futuras)

## Resumen del proyecto

Farmacomas Control es una aplicacion movil desarrollada con Ionic y Angular para apoyar a boticas y farmacias pequenas en la gestion diaria de sus operaciones. El sistema centraliza el registro de medicamentos, clientes, ventas y proveedores, mostrando indicadores importantes como productos por reponer, pedidos pendientes, ventas del dia, ventas del mes, valor total del inventario y medicamentos proximos a vencer.

La aplicacion trabaja con Firebase para autenticacion, almacenamiento en Cloud Firestore y sincronizacion de datos en tiempo real. Tambien conserva una copia local en el navegador o dispositivo para que el usuario pueda seguir trabajando cuando no hay conexion a internet.

## Problematica

Muchas boticas pequenas gestionan su stock, clientes y pedidos usando cuadernos, hojas de calculo o mensajes por WhatsApp. Esto genera problemas como:

- Dificultad para conocer el stock real de medicamentos.
- Perdida de tiempo al buscar productos o pedidos.
- Riesgo de quedarse sin medicamentos criticos.
- Falta de trazabilidad en ventas y atenciones.
- Escasa visibilidad sobre productos mas vendidos.
- Control manual de clientes frecuentes y proveedores.
- Mayor posibilidad de errores al descontar stock.

Farmacomas Control responde a esta necesidad con una solucion movil, simple y centralizada.

## Objetivos

### Objetivo general

Implementar una aplicacion movil para controlar inventario farmaceutico, registrar clientes, gestionar pedidos y sincronizar informacion con Firebase Cloud Firestore.

### Objetivos especificos

- Registrar medicamentos con categoria, laboratorio, precio, unidad, stock actual y stock minimo.
- Detectar automaticamente productos con stock bajo.
- Identificar medicamentos proximos a vencer.
- Registrar clientes y conservar su historial basico de compras.
- Crear pedidos asociados a un cliente y a un medicamento.
- Descontar stock automaticamente al registrar una venta.
- Marcar pedidos como entregados o cancelados.
- Restaurar stock cuando un pedido es cancelado.
- Registrar proveedores y laboratorios.
- Calcular indicadores operativos y financieros.
- Proteger datos por usuario mediante autenticacion.
- Mantener operatividad basica en modo local.
- Sincronizar cambios cuando la conexion vuelve a estar disponible.

## Usuarios beneficiados

El proyecto esta orientado a:

- Boticas independientes.
- Farmacias pequenas de barrio.
- Encargados de almacen farmaceutico.
- Personal que atiende ventas y pedidos.
- Administradores que necesitan indicadores rapidos del negocio.

El caso planteado se enfoca en boticas del distrito de Comas, pero la solucion puede adaptarse a otros distritos o negocios farmaceuticos pequenos.

## Alcance funcional

El sistema cubre las siguientes operaciones:

| Area | Funcionalidades incluidas |
| --- | --- |
| Acceso | Inicio de sesion, registro de usuario, recuperacion de contrasena y cierre de sesion |
| Dashboard | KPIs, ventas, alertas, top de productos y ultimos pedidos |
| Inventario | Crear, editar, buscar y eliminar medicamentos |
| Stock | Control de stock actual, stock minimo, alerta de reposicion y descuento automatico |
| Vencimiento | Deteccion de medicamentos vencidos o proximos a vencer |
| Clientes | Registro, edicion, busqueda, puntos y cantidad de pedidos |
| Pedidos | Registro de ventas, estados, metodos de pago, notas y total de venta |
| Proveedores | Registro, edicion, busqueda y eliminacion de proveedores |
| Sincronizacion | Guardado local, reintentos automaticos y actualizacion con Firebase |
| Android | Proyecto Capacitor y APK disponible para descarga desde la app |

## Modulos del sistema

### 1. Acceso seguro

Antes de usar el sistema, el usuario debe iniciar sesion o crear una cuenta. La autenticacion se gestiona con Firebase Authentication mediante correo y contrasena.

Incluye:

- Login.
- Registro de nuevo usuario.
- Recuperacion de contrasena.
- Cierre de sesion.
- Separacion de datos por usuario autenticado.

### 2. Panel de control

El panel resume el estado operativo de la farmacia. Esta pensado para que el usuario identifique rapidamente si necesita reponer productos, revisar pedidos o tomar decisiones de venta.

Indicadores mostrados:

- Total de productos en stock.
- Productos por reponer.
- Pedidos pendientes.
- Pedidos entregados.
- Ventas del dia.
- Ventas del mes.
- Valor total del inventario.
- Top 5 de medicamentos mas vendidos.
- Medicamentos proximos a vencer en 60 dias.
- Ultimos pedidos registrados.

### 3. Inventario de medicamentos

Permite registrar y mantener actualizada la informacion de cada producto.

Datos gestionados:

- Nombre del medicamento.
- Categoria.
- Laboratorio.
- Tipo de unidad: tableta, capsula, frasco, ampolla, crema, jarabe, solucion o sobre.
- Fecha de vencimiento.
- Stock actual.
- Stock minimo.
- Precio de venta.
- Indicador de receta medica.
- Descripcion opcional.

Funciones importantes:

- Busqueda por nombre, categoria o laboratorio.
- Edicion de medicamentos existentes.
- Eliminacion de medicamentos sin pedidos pendientes.
- Alerta visual cuando el stock esta por debajo del minimo.
- Identificacion de productos vencidos o por vencer.

### 4. Clientes

El modulo de clientes permite crear un directorio de pacientes o compradores frecuentes.

Datos gestionados:

- Nombre completo.
- Telefono.
- Distrito o zona.
- Correo electronico opcional.
- Direccion opcional.
- Puntos de fidelidad.
- Cantidad total de pedidos.
- Fecha de registro.

Funciones importantes:

- Busqueda por nombre, telefono, distrito o correo.
- Edicion de datos del cliente.
- Eliminacion controlada, evitando borrar clientes con pedidos pendientes.
- Acumulacion de puntos segun ventas realizadas.

### 5. Pedidos y ventas

Este modulo conecta clientes, medicamentos y stock. Al registrar un pedido, el sistema calcula el total, descuenta unidades del inventario y guarda el movimiento.

Datos del pedido:

- Cliente.
- Medicamento.
- Cantidad.
- Metodo de pago: efectivo, Yape, Plin, transferencia o tarjeta.
- Total de venta.
- Fecha.
- Estado: pendiente, entregado o cancelado.
- Notas opcionales.

Reglas de negocio:

- No permite registrar pedidos sin cliente, medicamento o cantidad valida.
- No permite vender mas unidades que el stock disponible.
- Descuenta el stock al crear el pedido.
- Marca pedidos como entregados.
- Cancela pedidos y restaura el stock.
- Permite eliminar pedidos del historial.

### 6. Proveedores

El modulo de proveedores organiza laboratorios y distribuidoras relacionados con el inventario.

Datos gestionados:

- Razon social.
- Persona de contacto.
- Telefono.
- Correo.
- Ciudad.
- Especialidad o categoria.
- Fecha de registro.

Funciones importantes:

- Registro y edicion de proveedores.
- Busqueda por nombre, categoria, ciudad o contacto.
- Eliminacion de proveedores.
- Relacion operativa con la reposicion de medicamentos.

## Flujos principales

### Flujo de inicio

1. El usuario abre la aplicacion.
2. El sistema verifica si existe una sesion activa.
3. Si no hay sesion, muestra el formulario de acceso.
4. Si hay sesion, carga los datos locales y luego intenta sincronizar con Firebase.
5. Si la base remota esta vacia, puede cargar datos iniciales de demostracion.

### Flujo de registro de medicamento

1. El usuario entra a Inventario.
2. Completa nombre, categoria, laboratorio, stock y precio.
3. El sistema valida que los datos obligatorios esten completos.
4. Guarda el medicamento en la vista local.
5. Intenta sincronizar el cambio con Firestore.
6. Si no hay conexion, deja el cambio pendiente para sincronizacion posterior.

### Flujo de venta

1. El usuario entra a Pedidos.
2. Selecciona cliente, medicamento, cantidad y metodo de pago.
3. El sistema valida stock disponible.
4. Calcula el total de venta.
5. Crea el pedido como pendiente.
6. Descuenta el stock del medicamento.
7. Suma puntos al cliente.
8. Guarda la operacion localmente y en la nube cuando sea posible.

### Flujo de cancelacion

1. El usuario selecciona un pedido pendiente.
2. Presiona cancelar.
3. El sistema cambia el estado del pedido a cancelado.
4. Devuelve al inventario las unidades descontadas.
5. Sincroniza la actualizacion con Firestore.

### Flujo offline

1. Si se pierde internet, la app cambia su estado a modo local.
2. Los cambios se guardan en LocalStorage.
3. El sistema marca que hay cambios pendientes.
4. Cada cierto tiempo intenta volver a sincronizar.
5. Cuando internet regresa, sube los cambios a Firebase.

## Arquitectura general

La aplicacion sigue una arquitectura de cliente movil/web con servicios de Firebase.

| Capa | Responsabilidad |
| --- | --- |
| Interfaz Ionic | Pantallas, formularios, tabs, tarjetas, botones y componentes visuales |
| Angular | Estructura de la aplicacion, enlace de datos, eventos y logica de pantalla |
| Servicios internos | Autenticacion, lectura, guardado, sincronizacion y mapeo de datos |
| LocalStorage | Copia local por usuario y respaldo de cambios pendientes |
| Firebase Auth | Registro, login, recuperacion de contrasena y sesion |
| Cloud Firestore | Base de datos remota por usuario |
| Capacitor | Empaquetado y ejecucion como app Android |
| Hosting/Vercel | Despliegue web de la aplicacion compilada |

Estructura de carpetas relevante:

| Ruta | Proposito |
| --- | --- |
| `src/app/home` | Pantalla principal con dashboard, inventario, clientes, pedidos y proveedores |
| `src/app/services` | Servicios de autenticacion y datos con Firebase |
| `src/app/core` | Modelos de datos y base inicial de demostracion |
| `src/environments` | Configuracion de entorno y Firebase |
| `src/assets` | Recursos estaticos, incluido el APK descargable |
| `android` | Proyecto Android generado por Capacitor |
| `firestore.rules` | Reglas de seguridad de Cloud Firestore |
| `firebase.json` | Configuracion para Firebase Hosting y Firestore |
| `vercel.json` | Configuracion para despliegue en Vercel |
| `www` | Carpeta generada al compilar la aplicacion |

## Tecnologias utilizadas

| Tecnologia | Uso dentro del proyecto |
| --- | --- |
| Ionic Framework 8 | Componentes moviles e interfaz adaptable |
| Angular 19 | Framework principal de la aplicacion |
| TypeScript 5.8 | Tipado, modelos y logica de negocio |
| Firebase 11 | Autenticacion y base de datos en la nube |
| Cloud Firestore | Almacenamiento de medicamentos, clientes, pedidos y proveedores |
| Capacitor 7 | Compilacion y empaquetado para Android |
| Ionicons | Iconografia de la interfaz |
| LocalStorage | Respaldo local y soporte offline |
| Vercel/Firebase Hosting | Opciones de publicacion web |

## Modelo de datos

El sistema trabaja con cuatro entidades principales.

### Medicamento

Representa cada producto disponible en inventario.

Campos funcionales:

- Identificador.
- Nombre.
- Categoria.
- Laboratorio.
- Codigo de barras opcional.
- Stock actual.
- Stock minimo.
- Precio.
- Fecha de vencimiento.
- Tipo de unidad.
- Requiere receta.
- Descripcion opcional.

### Cliente

Representa a una persona que realiza compras o pedidos.

Campos funcionales:

- Identificador.
- Nombre.
- Telefono.
- Distrito.
- Correo opcional.
- Direccion opcional.
- Fecha de nacimiento opcional.
- Puntos de fidelidad.
- Total de pedidos.
- Fecha de registro.

### Pedido

Representa una venta o solicitud de medicamento.

Campos funcionales:

- Identificador.
- Cliente asociado.
- Medicamento asociado.
- Cantidad.
- Estado.
- Fecha de creacion.
- Precio total.
- Metodo de pago.
- Notas opcionales.
- Fecha de entrega opcional.

### Proveedor

Representa un laboratorio o distribuidora.

Campos funcionales:

- Identificador.
- Nombre o razon social.
- Contacto.
- Telefono.
- Correo.
- Ciudad.
- Categoria o especialidad.
- Fecha de registro.

## Firebase y seguridad

Firebase se usa para dos partes centrales:

- Firebase Authentication: controla el acceso al sistema.
- Cloud Firestore: guarda los datos de cada usuario.

La base de datos organiza la informacion por usuario autenticado. Cada cuenta tiene su propio espacio de datos, por lo que un usuario no deberia acceder a la informacion de otro.

Regla de seguridad aplicada:

- Solo un usuario autenticado puede leer o escribir sus propios documentos.
- Los datos se guardan bajo una ruta asociada al identificador unico de usuario.
- Si no hay sesion, las operaciones de gestion no se permiten.

Colecciones funcionales:

- Medicamentos.
- Clientes.
- Pedidos.
- Proveedores.

Nota importante para exposicion: el README no publica claves internas ni credenciales. La configuracion tecnica existe en el proyecto, pero no es necesario mostrarla durante la sustentacion.

## Modo offline y sincronizacion

Una fortaleza del proyecto es que no depende totalmente de la conexion en cada segundo de uso.

Comportamiento implementado:

- Al iniciar sesion, la app carga datos locales si existen.
- Luego intenta leer datos desde Firebase.
- Si Firebase esta disponible, sincroniza la informacion.
- Si no hay conexion, la aplicacion continua en modo local.
- Los cambios quedan marcados como pendientes.
- Las eliminaciones se guardan en una cola local.
- El sistema reintenta sincronizar automaticamente.
- Cuando vuelve internet, sube los cambios pendientes.

Estados visibles en la interfaz:

- Acceso seguro.
- Datos actualizados.
- Pendiente de subir.
- Guardado local.
- Sin internet.
- Sincronizando.

## Datos de demostracion

El proyecto incluye una base inicial para poder exponer el sistema sin empezar desde cero.

Contenido demo:

- 30 medicamentos.
- 15 clientes.
- 20 pedidos historicos.
- 8 proveedores.

Estos datos permiten mostrar dashboard, alertas, ventas, clientes frecuentes y proveedores durante la exposicion.

## Aplicacion Android

El proyecto esta preparado para ejecutarse como app Android mediante Capacitor.

Datos relevantes:

- Nombre de app: Farmacomas Control.
- Identificador Android: `com.farmacomas.control`.
- Carpeta Android: `android`.
- APK incluido para descarga: `src/assets/farmacomas.apk`.
- La interfaz tiene un boton para descargar el APK desde la propia aplicacion web.

Esto permite presentar el proyecto como aplicacion movil, no solo como pagina web.

## Instalacion y ejecucion

### Requisitos

- Node.js instalado.
- npm instalado.
- Visual Studio Code recomendado.
- Navegador moderno.
- Opcional: Ionic CLI.
- Opcional: Android Studio para generar o abrir el proyecto Android.

### Instalar dependencias

Desde la carpeta del proyecto:

```bash
npm install
```

### Ejecutar en navegador

```bash
npm start
```

Tambien se puede ejecutar con Ionic si esta instalado:

```bash
ionic serve
```

URL habitual en desarrollo:

```text
http://localhost:4200
```

Con Ionic suele abrirse en:

```text
http://localhost:8100
```

### Compilar version web

```bash
npm run build
```

La salida de produccion se genera en:

```text
www
```

### Servir la version compilada

```bash
npm run serve:dist
```

URL habitual:

```text
http://127.0.0.1:8100
```

## Comandos utiles

| Comando | Funcion |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm start` | Ejecuta Angular en modo desarrollo |
| `ionic serve` | Ejecuta la app con Ionic CLI |
| `npm run build` | Compila la app en la carpeta `www` |
| `npm run serve:dist` | Sirve localmente la version compilada |
| `npm test` | Ejecuta pruebas configuradas con Karma/Jasmine |
| `npm run lint` | Ejecuta revision de lint si esta disponible |

## Despliegue

El proyecto incluye configuracion para dos caminos de publicacion.

### Vercel

La configuracion indica:

- Comando de build: `npm run build`.
- Carpeta de salida: `www`.
- Reescritura de rutas hacia `index.html` para soportar navegacion de Angular.

### Firebase Hosting

La configuracion indica:

- Publicacion desde `www`.
- Reglas de Firestore desde `firestore.rules`.
- Reescritura de rutas hacia `index.html`.

## Como exponer el proyecto

### Mensaje inicial sugerido

Farmacomas Control es una aplicacion movil para boticas pequenas que necesitan controlar inventario, ventas, clientes y proveedores de forma rapida. El sistema evita depender de registros manuales, muestra alertas de stock y vencimiento, y sincroniza la informacion en Firebase con acceso seguro por usuario.

### Demo recomendada

1. Abrir la aplicacion.
2. Crear una cuenta o iniciar sesion.
3. Mostrar el panel de control y explicar los indicadores.
4. Entrar a Inventario y buscar un medicamento.
5. Registrar un medicamento nuevo con stock minimo.
6. Mostrar que aparece como producto por reponer si corresponde.
7. Entrar a Clientes y registrar un cliente.
8. Entrar a Pedidos y crear una venta.
9. Mostrar que el stock del medicamento disminuye automaticamente.
10. Marcar el pedido como entregado.
11. Crear otro pedido y cancelarlo para mostrar restauracion de stock.
12. Entrar a Proveedores y mostrar el registro de laboratorios.
13. Explicar el estado de sincronizacion con Firebase.
14. Mostrar el boton de descarga del APK o la vista movil.

### Puntos fuertes para defender

- Soluciona una problematica real de boticas pequenas.
- Tiene autenticacion y separacion de datos por usuario.
- Integra Firebase Auth y Cloud Firestore.
- Tiene soporte offline con guardado local.
- Automatiza el descuento y restauracion de stock.
- Muestra indicadores utiles para tomar decisiones.
- Incluye version Android con Capacitor.
- Presenta una interfaz movil organizada por modulos.
- Usa datos de demostracion para validar el flujo completo.

### Preguntas posibles y respuestas cortas

| Pregunta | Respuesta sugerida |
| --- | --- |
| Por que usar Firebase? | Porque permite autenticacion, base de datos en tiempo real y sincronizacion sin crear un servidor propio. |
| Que pasa si se va internet? | La aplicacion guarda cambios localmente y los sincroniza cuando vuelve la conexion. |
| Como se protege la informacion? | Cada usuario inicia sesion y solo puede acceder a sus propios datos. |
| Como se evita vender sin stock? | Antes de crear el pedido, el sistema verifica la cantidad disponible. |
| Que ocurre si se cancela una venta? | El pedido cambia a cancelado y el stock se restaura. |
| Es solo web? | No. Tambien esta preparado como app Android mediante Capacitor. |
| Tiene datos para probar? | Si. Incluye medicamentos, clientes, pedidos y proveedores de demostracion. |

## Criterios de evaluacion cubiertos

- Aplicacion movil con Ionic.
- Uso de Angular y TypeScript.
- Formularios y validaciones.
- Gestion completa de entidades principales.
- Persistencia local.
- Conexion con Firebase.
- Autenticacion de usuarios.
- Reglas de seguridad en Firestore.
- Sincronizacion en nube.
- Dashboard con metricas.
- Generacion o disponibilidad de APK.
- Documentacion de instalacion, uso y exposicion.

## Limitaciones y mejoras futuras

El proyecto cumple el flujo principal de gestion farmaceutica, pero se puede seguir ampliando.

Mejoras posibles:

- Escaneo real de codigos de barras.
- Reportes descargables en PDF o Excel.
- Roles diferenciados: administrador, vendedor y almacen.
- Historial avanzado de auditoria.
- Notificaciones push para stock bajo o vencimientos.
- Registro de compras a proveedores.
- Control de lotes por medicamento.
- Adjuntar recetas medicas.
- Integracion con impresora de tickets.
- Dashboard con graficos historicos por semana o mes.
- Filtros avanzados por categoria, laboratorio y estado.

## Estado actual del proyecto

Estado funcional observado:

- La aplicacion tiene una pantalla principal unificada.
- El acceso se maneja con Firebase Auth.
- Los datos se guardan por usuario en Firestore.
- Existen modulos de dashboard, inventario, clientes, pedidos y proveedores.
- Hay datos demo para exponer el flujo.
- El proyecto tiene configuracion Android con Capacitor.
- Existe APK disponible como recurso descargable.
- El build web genera salida en `www`.

## Informacion academica

| Campo | Detalle |
| --- | --- |
| Nombre del proyecto | Farmacomas Control |
| Tipo | Aplicacion movil/web |
| Area | Gestion farmaceutica |
| Enfoque | Boticas pequenas y control operativo |
| Framework principal | Ionic + Angular |
| Base de datos | Firebase Cloud Firestore |
| Autenticacion | Firebase Authentication |
| Plataforma movil | Android mediante Capacitor |
| Ultima revision del README | 14 de julio de 2026 |

## Nota final

Este README esta escrito para presentar el proyecto completo sin exponer el codigo fuente. Para una sustentacion, lo mas importante es explicar la problematica, mostrar los modulos funcionando, demostrar el descuento de stock en una venta, explicar la seguridad por usuario y destacar la sincronizacion con Firebase.
