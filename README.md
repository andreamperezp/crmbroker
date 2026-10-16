# Brokerflow · CRM para brokers de seguros

> **Es una demo.** Los clientes, las pólizas y las aseguradoras (Ceibo, Alerce,
> Faro, Brisa y Tala Seguros) son inventados. Todo vive en el navegador: al
> recargar la página, la demo vuelve a empezar. No se guarda ni se envía ningún dato.

**Brokerflow** acompaña el día a día de un broker de seguros: desde que alguien
pide una cotización hasta que paga su última cuota. Tiene cuatro perfiles
conectados entre sí. Lo que hace uno le llega al otro al instante, con un aviso
y un contador en su pestaña.

| Perfil                 | Quién               | Para qué lo usa                                                                   |
| ---------------------- | ------------------- | --------------------------------------------------------------------------------- |
| **Asesor comercial**   | Martina Ríos        | Seguir oportunidades, cotizar, buscar clientes nuevos con IA y acompañar después de la venta. |
| **Administración**     | Julián Sosa         | Emitir pólizas, gestionar siniestros, endosos y bajas, y ordenar la documentación. |
| **Cobranzas**          | Valeria Luna        | Ver lo cobrado del mes, seguir la mora temprana y tardía, contactar y armar planes de pago. |
| **Autogestión**        | Lucía Fernández     | Ver sus pólizas, pagar, denunciar un siniestro, bajar certificados, cotizar y chatear con su asesora. |

> El problema que resuelve: en muchos brokers la información vive repartida
> entre planillas, WhatsApp y el sistema de cada aseguradora. Se pierden leads
> por no volver a llamar, los trámites no tienen un responsable claro y la mora
> se descubre cuando la póliza ya está por anularse.

## Cómo se conectan los perfiles

1. **El cliente se da de alta o pide una cotización** en la autogestión. El sistema
   le asigna el asesor con menos carga y crea el lead.
2. **El asesor lo trabaja** en su embudo (nueva → contactada → cotizada →
   negociación → ganada). Al ganarla, pasa sola a administración.
3. **Administración emite la póliza** con un asistente de 4 pasos y su checklist.
   La póliza aparece en la autogestión y la primera cuota, en cobranzas.
4. **Cobranzas acompaña los pagos.** Si alguien se atrasa, confirma el pase a mora
   (temprana hasta 30 días, tardía después), le escribe, registra llamadas y
   promesas, o le arma un plan de pago. El cliente lo ve en su portal y el asesor
   recibe una tarea para acompañarlo.

## Lo que se puede probar

### Asesor comercial

- **Oportunidades**: tablero por etapa, filtro por ramo, alerta cuando un lead lleva 5 días sin contacto.
- **Prospección con IA**: un botón simula la búsqueda de posibles clientes en fuentes públicas,
  con la señal que los hace interesantes y su afinidad. Se suman al embudo en un toque.
- **Ficha del cliente**, **cotizador** (5 aseguradoras, envío por WhatsApp), **postventa** y **renovaciones**.

### Administración

- **Trámites** con responsable, tiempo de respuesta, checklist y pasos.
- **Emisión** guiada, **siniestros** con el relato del asegurado, **endosos y bajas**, **documentación**.

### Cobranzas

- **Tablero mensual**: cobrado, por vencer, mora temprana y tardía, cobro por semana y medios de pago.
- **Mora**, **gestión de contacto** (chat con plantillas y registro de llamadas), **planes de pago**
  (hasta 3 cuotas sin recargo, 4 con 5 %, 6 con 10 %) y **reportes** por mes y por aseguradora.

### Autogestión

- Portal web y versión celular (en un teléfono se ve siempre la versión celular).
- Pago de varias cuotas juntas, denuncia de siniestro en 3 pasos con fotos,
  certificados, cotizador con "La quiero" y chat con la asesora.

## Diseño

Parte de un prototipo hecho en Claude Design. Tipografía **Figtree**, íconos
**Material Symbols Rounded** y una paleta índigo (`#4B55D6`) sobre azul noche
(`#151A3D`), con verde, ámbar, coral y turquesa para los estados.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- Estado en memoria con `useReducer` + contexto (`src/lib/store.tsx`): cada acción
  deja avisos para los otros perfiles.

```bash
npm install
npm run dev
```

Abrí <http://localhost:3000> y elegí un perfil.

| Carpeta            | Qué hay                                                    |
| ------------------ | ---------------------------------------------------------- |
| `src/app`          | Rutas: ingreso, y un grupo `(demo)` con la barra de perfiles |
| `src/views`        | Las pantallas de cada perfil                               |
| `src/lib`          | Datos de ejemplo, reglas (mora, planes, SLA) y el estado   |
| `src/components`   | Interfaz compartida: botones, tarjetas, logo               |

---

Diseño y desarrollo: [Andrea Pérez](https://andreaperez.dev).
