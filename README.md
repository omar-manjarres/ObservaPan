# 🥖 ObservaPan

**Observatorio Empresarial del Sector Panadero de Valledupar**
Sistema de información para el seguimiento productivo, administrativo y comercial de las panaderías.

ObservaPan permite registrar, almacenar, consultar, analizar y comparar información de
las panaderías participantes a lo largo del tiempo. No es un simple formulario: es un
sistema de información que calcula indicadores, conserva el historial, genera alertas
automáticas, compara cada panadería con su propio histórico y con el promedio del sector,
y produce reportes exportables a PDF y Excel.

## 1. Tecnologías

- **React 18 + TypeScript + Vite**
- **Firebase** — Authentication, Cloud Firestore, Security Rules y Hosting
- **Tailwind CSS** — estilos con identidad del sector panadero
- **React Router** — navegación y rutas protegidas
- **React Hook Form + Zod** — formularios y validaciones
- **Recharts** — gráficas de barras, líneas y radar
- **Lucide React** — íconos
- **date-fns** — manejo de fechas
- **xlsx** y **jsPDF / jspdf-autotable** — exportación de reportes

## 2. Requisitos previos

- Node.js 18 o superior
- Una cuenta de Firebase y un proyecto creado
- Firebase CLI: `npm install -g firebase-tools`

## 3. Instalación

```bash
npm install
```

## 4. Configurar Firebase

1. En la [consola de Firebase](https://console.firebase.google.com) crea un proyecto.
2. Activa **Authentication → Sign-in method → Correo electrónico/contraseña**.
3. Crea una base de datos **Cloud Firestore** (modo producción).
4. En *Configuración del proyecto → Tus apps* registra una **app web** y copia las credenciales.

## 5. Crear el archivo `.env`

Copia el ejemplo y rellena los valores de tu app web:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> El archivo `.env` **no** debe subirse al repositorio (ya está en `.gitignore`).

## 6. Ejecutar en desarrollo

```bash
npm run dev
```

## 7. Build de producción

```bash
npm run build
```

## 8. Desplegar reglas y hosting en Firebase

```bash
firebase login
firebase init        # selecciona Firestore y Hosting; usa dist como carpeta pública
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting
```

(`firebase.json`, `firestore.rules` y `firestore.indexes.json` ya están incluidos.)

## 9. Crear el primer usuario administrador

Firebase Authentication y el perfil/rol en Firestore son dos cosas distintas.

**Opción A — con el script de datos de prueba (recomendado para empezar):**

1. En *Configuración del proyecto → Cuentas de servicio* genera una clave privada
   y guárdala como `serviceAccountKey.json` en la raíz (ignorada por git).
2. Ejecuta:

   ```bash
   npm run seed
   ```

   Esto crea usuarios demo, 5 panaderías, el formulario activo y registros históricos.

   Usuarios demo (contraseña `ObservaPan2026*`):

   | Correo | Rol |
   |---|---|
   | admin@observapan.co | Administrador |
   | encuestador@observapan.co | Encuestador |
   | panaderia@observapan.co | Panadería |
   | consultor@observapan.co | Consultor |

**Opción B — manual:**

1. En **Authentication** crea el usuario (correo + contraseña). Copia su **UID**.
2. En **Firestore** crea el documento `users/{UID}` con:

   ```json
   { "displayName": "Administrador", "email": "tu@correo.com", "role": "admin", "status": "active" }
   ```

3. Inicia sesión. Desde el módulo **Usuarios** ya puedes registrar el resto de perfiles.

## 10. Roles del sistema

- **Administrador** — acceso total: usuarios, panaderías, formularios, registros, indicadores, reportes, auditoría y configuración.
- **Encuestador** — registra y edita (borradores) diagnósticos de las panaderías asignadas.
- **Panadería** — ve únicamente su información, indicadores, evolución, alertas y reportes propios.
- **Consultor / Investigador** — ve información agregada del sector, dashboards y reportes sectoriales; no edita datos.

## 11. Estructura de carpetas

```txt
src/
  components/   ui, layout, auth, dashboard, forms, reports
  config/       firebase.ts
  constants/    roles, variables, routes
  context/      AuthContext
  hooks/        useAuth, useAsync, useBakeries, useForms, useRecords, useIndicators
  pages/        18 pantallas (login, dashboard, panaderías, registros, indicadores, ...)
  services/     auth, user, bakery, form, record, indicator, alert, report, audit, config, diagnosticEngine
  types/        modelos de datos
  utils/        scoring, dates, formatters, permissions, exportExcel, exportPdf
firestore.rules
firestore.indexes.json
firebase.json
scripts/seed.ts
```

## 12. Funcionalidades principales

- Autenticación con recuperación de contraseña y rutas protegidas por rol.
- **Auto-registro de panaderías**: una panadería crea su cuenta (rol `bakery`), queda activa de inmediato y puede diligenciar su propio diagnóstico. Las consultas son por alcance: una panadería solo ve sus propios datos.
- Dashboard con KPIs, evolución por periodo, comparativa de variables, ranking de problemáticas y panaderías con mayor mejora/retroceso.
- Gestión de panaderías (CRUD, filtros, detalle con historial e indicadores).
- Gestión de usuarios y roles.
- Constructor de formularios con secciones por variable, tipos de pregunta y dirección (positiva/negativa/neutral) con inversión de puntaje.
- Registro de diagnósticos por periodo (borrador/finalizado) con cálculo de puntajes en vivo.
- Cálculo de indicadores por variable, puntaje global, tendencia y nivel de riesgo (`src/utils/scoring.ts`).
- Generación automática de alertas e *indicator snapshots* al finalizar un registro (`src/services/diagnosticEngine.ts`).
- Comparaciones: histórico propio, panadería vs sector, periodo vs periodo (líneas, barras y radar).
- Reportes individuales y sectoriales exportables a **PDF** y **Excel**.
- Auditoría de acciones (crear, editar, login, exportar, generar reporte…).

## 13. Cálculo de puntajes (resumen)

Escala de frecuencia: Nunca=1 … Siempre=5. Las preguntas **negativas** invierten la
escala. El puntaje por variable es el promedio ponderado de sus preguntas con
`affectsScore = true`; el global es el promedio de las variables disponibles.

- Tendencia: mejora (> +0.20), retroceso (< −0.20), estable (intermedio).
- Riesgo: alto (< 2.5), medio (2.5–3.5), bajo (> 3.5). Umbrales configurables en *Configuración*.

## 15. Despliegue en GitHub Pages

La app es una SPA estática, por lo que puede publicarse en GitHub Pages. Ya quedó
preconfigurada:

- `vite.config.ts` usa `base: "./"` (rutas relativas, válidas en cualquier subruta).
- El enrutamiento usa `HashRouter`, por lo que no hay errores 404 al recargar.
- `.env.production` contiene la configuración pública de Firebase usada en el build.
- `public/.nojekyll` evita el procesamiento Jekyll de GitHub.
- `.github/workflows/deploy.yml` compila y publica automáticamente en cada push a `main`.

Pasos para publicar:

1. Sube el proyecto a un repositorio de GitHub (no subas `.env` ni `serviceAccountKey.json`; ya están en `.gitignore`).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Haz push a la rama `main`. El workflow construye y despliega solo.
4. La app quedará en `https://TU_USUARIO.github.io/NOMBRE_REPO/`.
5. (Recomendado) En Firebase → **Authentication → Settings → Authorized domains**, agrega `TU_USUARIO.github.io`.

> El inicio de sesión por correo/contraseña funciona en GitHub Pages sin pasos extra.
> Agregar el dominio autorizado solo es imprescindible si más adelante activas
> proveedores OAuth (Google, etc.).

Alternativa manual (sin Actions): `npm run build` y sube el contenido de `dist/` a la rama `gh-pages`.

## 14. Limitaciones / pendientes

- El alta de credenciales en Authentication se hace desde la consola o el script seed; el módulo de Usuarios gestiona el **perfil y rol** asociados a un UID existente (no crea la contraseña desde el cliente por seguridad). Para creación de credenciales desde la app se recomienda una Cloud Function con privilegios de admin.
- La alerta de "panadería sin actualización en el periodo" se modela en los tipos y reglas; conviene ejecutarla mediante una tarea programada (Cloud Scheduler + Function).
