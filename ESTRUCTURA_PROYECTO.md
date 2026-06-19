# Colmena App - Estructura del Proyecto

## 📁 Estructura de Carpetas

```
colmena-app/
├── src/
│   ├── components/
│   │   ├── Avatar.tsx
│   │   ├── Avatar.css
│   │   ├── Badge.tsx
│   │   ├── Badge.css
│   │   ├── Button.tsx
│   │   ├── Button.css
│   │   ├── Card.tsx
│   │   ├── Card.css
│   │   ├── ErrorAlert.tsx
│   │   ├── ErrorAlert.css
│   │   ├── Header.tsx
│   │   ├── Header.css
│   │   ├── Loading.tsx
│   │   ├── Loading.css
│   │   └── StatCard.tsx
│   │   └── StatCard.css
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── LoginScreen.css
│   │   ├── DashboardScreen.tsx
│   │   ├── DashboardScreen.css
│   │   ├── CondominiosScreen.tsx
│   │   ├── CondominiosScreen.css
│   │   ├── CondominioDetailScreen.tsx
│   │   ├── CondominioDetailScreen.css
│   │   ├── InvoicesScreen.tsx
│   │   └── InvoicesScreen.css
│   │
│   ├── styles/
│   │   └── global.css
│   │
│   ├── types.ts
│   ├── encryption.ts
│   ├── whmcsApi.ts
│   ├── stores.ts
│   ├── hooks.ts
│   ├── App.tsx
│   └── main.tsx
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

---

## 🚀 Cómo Montar el Proyecto

### 1. **Crear proyecto base**

```bash
npm create vite@latest colmena-app -- --template react-ts
cd colmena-app
npm install
```

### 2. **Copiar archivos según estructura**

Copiar los archivos en las carpetas correspondientes:

```
src/
├── components/          # Avatar.*, Badge.*, Button.*, Card.*, ErrorAlert.*, Header.*, Loading.*, StatCard.*
├── screens/             # *Screen.tsx + *Screen.css
├── styles/              # global.css
└── (archivos raíz)      # types.ts, encryption.ts, whmcsApi.ts, stores.ts, hooks.ts, App.tsx, main.tsx
```

Copiar en raíz:
- `index.html`
- `package.json` (reemplazar el existente)
- `tsconfig.json` (reemplazar)
- `vite.config.ts`

### 3. **Instalar dependencias**

```bash
npm install
```

### 4. **Verifica que funcione**

```bash
npm run dev
```

Debería:
- Abrir `http://localhost:5173`
- Mostrar LoginScreen con el logo Colmena
- Aceptar URL, usuario, contraseña
- Conectar a WHMCS y navegar a Dashboard

---

## 📝 Archivos por Categoría

### **Core (Sin cambios)**
- `types.ts` — Types TypeScript
- `encryption.ts` — Seguridad + AES-256
- `whmcsApi.ts` — Wrapper WHMCS
- `stores.ts` — Zustand stores
- `hooks.ts` — React Query hooks

### **Infraestructura (Configurable)**
- `App.tsx` — Router principal
- `main.tsx` — Entry point
- `index.html` — Root HTML
- `package.json` — Dependencias
- `tsconfig.json` — TypeScript config
- `vite.config.ts` — Vite config

### **Components (Reutilizables, casi listos)**
- `Header.tsx` — Barra superior
- `Card.tsx` — Contenedor genérico
- `Badge.tsx` — Estados (active, pending, etc.)
- `Button.tsx` — Botones
- `StatCard.tsx` — Estadísticas
- `Avatar.tsx` — Fotos de usuario
- `Loading.tsx` — Spinner
- `ErrorAlert.tsx` — Errores

### **Screens (Falta completar)**
- ✅ `LoginScreen.tsx` — **COMPLETA Y FUNCIONAL**
- 🟡 `DashboardScreen.tsx` — **Estructura lista, falta llenar**
- 🟡 `CondominiosScreen.tsx` — **Skeleton, TODO**
- 🟡 `CondominioDetailScreen.tsx` — **Skeleton, TODO**
- 🟡 `InvoicesScreen.tsx` — **Skeleton, TODO**

---

## 🎨 Estilos CSS

### Estructura
Cada componente y pantalla tiene su `.css` asociado.

### Variables CSS (en `global.css`)
```css
--color-primary: #0052cc
--color-primary-light: #0066ff
--color-success: #157a3b
--color-danger: #e24b4a
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--radius-lg: 12px
```

Usar variables en lugar de hardcodear colores.

---

## 🔄 Flujo de Datos

```
LoginScreen
    ↓
    (input: URL, user, pass)
    ↓
    encryption.validateLoginCredentials()
    ↓
    whmcsApi.validateCredentials()
    ↓
    useAuthStore.login()  ← encripta automáticamente
    ↓
    App.tsx redirige a /dashboard
    ↓
DashboardScreen
    ↓
    useClientGroups(api) ← obtiene grupos
    ↓
    useDashboardStats(api) ← obtiene stats
    ↓
    useCondoStore guarda datos
    ↓
    Pantalla renderiza
```

---

## 🧪 Testing Local

### 1. **LoginScreen**
- URL: `http://localhost:5173`
- Ingresa credenciales de WHMCS
- Debe conectar y navegar a `/dashboard`

### 2. **DashboardScreen**
- Ver estadísticas (total clientes, pendiente, etc.)
- Selector de condominio si hay múltiples
- Botones para ir a "Ver Condóminos" y "Ver Invoices"

### 3. **Otras screens**
- De momento solo tienen header + skeleton
- Falta implementar contenido

---

## 🔐 Seguridad

- ✅ Credenciales encriptadas con AES-256
- ✅ Almacenadas en localStorage (no en memoria)
- ✅ Logout limpia todo
- ✅ Valida URL + credenciales antes de guardar
- ✅ Manejo de errores CORS, timeout, 401/403

---

## 📦 Dependencias

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "@tanstack/react-query": "^5.25.0",
  "axios": "^1.6.2",
  "zustand": "^4.4.1",
  "tweetnacl": "^1.0.3",
  "js-base64": "^3.7.5"
}
```

---

## ⚙️ Próximos Pasos

1. **Copiar archivos** según estructura
2. **`npm install`**
3. **`npm run dev`** y probar LoginScreen
4. **Implementar CondominiosScreen** — listar condóminos
5. **Implementar CondominioDetailScreen** — detalles + invoices
6. **Implementar InvoicesScreen** — todas las invoices
7. **Estilos finales** — pulir UI
8. **PWA setup** — manifest, service worker
9. **Vercel deploy**

---

## 🆘 Checklist de Montaje

- [ ] Crear proyecto con Vite
- [ ] Copiar archivos en estructura
- [ ] `npm install`
- [ ] `npm run dev` funciona
- [ ] LoginScreen renderiza
- [ ] Login valida credenciales
- [ ] Dashboard carga datos
- [ ] Error handling funciona
- [ ] Logout limpia todo
- [ ] Ready para llenar screens

**Cuando hayas montado TODO, me avisas y continuamos con CondominiosScreen.**
