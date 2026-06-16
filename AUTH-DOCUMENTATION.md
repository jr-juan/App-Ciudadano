# Sistema de Autenticación Firebase - App Ciudadano

Sistema completo de autenticación con Firebase Authentication v10+ (modular SDK) integrado en la app Angular/Ionic.

## 🚀 Características Implementadas

### 1. **Registro de Usuario (Sign Up)**
- **Ruta:** `/auth/register`
- **Campos:** Nombre completo, correo electrónico, contraseña, confirmación de contraseña
- **Validación en tiempo real:**
  - Email válido (formato RFC)
  - Contraseña ≥ 8 caracteres con mayúscula, número y símbolo
  - Las dos contraseñas deben coincidir
- **Envío automático de email de verificación** tras el registro
- **Perfil guardado en Firestore** con estructura:
  ```json
  {
    "uid": "string",
    "displayName": "string",
    "email": "string",
    "createdAt": "timestamp",
    "emailVerified": false,
    "photoURL": null
  }
  ```
- **Manejo de errores específicos:**
  - `auth/email-already-in-use` → "El correo ya está en uso..."
  - `auth/weak-password` → "La contraseña es demasiado débil..."
  - `auth/invalid-email` → "El correo no es válido..."

### 2. **Inicio de Sesión (Sign In)**
- **Ruta:** `/auth/login`
- **Métodos:**
  - Email + contraseña
  - Google Sign-In (con `GoogleAuthProvider`)
- **Opciones de sesión:**
  - "Recordarme": `browserLocalPersistence` (mantiene sesión)
  - Sin marcar: `browserSessionPersistence` (cierra al recargar)
- **Bloqueo por intentos fallidos:**
  - Se bloquea después de 5 intentos fallidos
  - Bloqueo temporal de 10 minutos
  - Almacenamiento en `localStorage` (cliente)
  - Contador visible en el mensaje de error
- **Validación de email:**
  - Si el email no está verificado → redirige a `/auth/verify-email`
  - Si está verificado → redirige a `/tabs/tab1`

### 3. **Recuperación de Contraseña (Forgot Password)**
- **Ruta:** `/auth/forgot-password`
- **Campos:** Solo correo electrónico
- **Función:** Envía email de recuperación con `sendPasswordResetEmail()`
- **Seguridad:** No revela si el correo existe (mismo mensaje para todos)
- **Pantalla de confirmación:** "Revisa tu bandeja de entrada"

### 4. **Verificación de Email (Email Verification)**
- **Ruta:** `/auth/verify-email`
- **Acceso:** 
  - Automático si el usuario se registró o inició sesión sin verificar
  - Manual desde `/tabs` si lo desea
- **Funciones:**
  - Botón "Reenviar correo" para reenviar verificación
  - Redirigir a `/tabs` una vez verificado (detección automática con `onAuthStateChanged`)
- **Mensaje clara:** "Por favor verifica tu correo..."

### 5. **Cerrar Sesión (Sign Out)**
- **Ubicación:** Botón "Cerrar sesión" en el header de `/tabs`
- **Acciones:**
  - Llama a `signOut()` de Firebase
  - Limpia estado global (BehaviorSubjects)
  - Redirige a `/auth/login`

### 6. **Rutas Protegidas (Guards)**

#### `AuthGuard` (canActivate, canActivateChild)
- Protege rutas privadas: `/tabs/**`, `/mapa/**`
- Valida:
  - Si hay usuario autenticado
  - Si el email está verificado
  - Redirige a `/auth/verify-email` si no está verificado
  - Redirige a `/auth/login` si no hay usuario
- **Espera:** Valida que `authReady$` sea true antes de proceder

#### `GuestGuard` (canActivate)
- Protege rutas de autenticación: `/auth/login`, `/auth/register`, `/auth/forgot-password`
- Si ya está autenticado:
  - Con email verificado → redirige a `/tabs`
  - Sin verificación → redirige a `/auth/verify-email`
- Permite acceso si no hay usuario

---

## 📁 Estructura de Archivos

```
src/app/
├── auth/
│   ├── auth.module.ts                 # Módulo con declaraciones y rutas
│   ├── auth-routing.module.ts         # Rutas de auth (lazy-loaded)
│   ├── login/
│   │   ├── login.page.ts              # Componente login
│   │   ├── login.page.html
│   │   └── login.page.scss
│   ├── register/
│   │   ├── register.page.ts           # Componente registro
│   │   ├── register.page.html
│   │   └── register.page.scss
│   ├── forgot-password/
│   │   ├── forgot-password.page.ts    # Recuperación de contraseña
│   │   ├── forgot-password.page.html
│   │   └── forgot-password.page.scss
│   └── verify-email/
│       ├── verify-email.page.ts       # Verificación de email
│       ├── verify-email.page.html
│       └── verify-email.page.scss
├── guards/
│   ├── auth.guard.ts                  # Protege rutas privadas
│   └── guest.guard.ts                 # Protege rutas públicas
├── services/
│   ├── auth.service.ts                # Lógica de autenticación
│   └── firebase.config.ts             # Configuración Firebase (ya existía)
├── tabs/
│   ├── tabs.page.ts                   # Actualizado con logout
│   ├── tabs.page.html                 # Actualizado con botón logout
│   └── ...
├── app-routing.module.ts              # Rutas principales actualizadas
└── app.module.ts
```

---

## 🔧 Servicios Principales

### `AuthService`

#### Métodos de Autenticación
```typescript
// Registro
async register(fullName: string, email: string, password: string): Promise<User>

// Login con email/contraseña
async login(email: string, password: string, rememberMe: boolean): Promise<User>

// Login con Google
async loginWithGoogle(): Promise<User>

// Recuperación de contraseña
async forgotPassword(email: string): Promise<void>

// Reenviar email de verificación
async resendVerificationEmail(user?: User): Promise<void>

// Cerrar sesión
async signOut(): Promise<void>
```

#### Métodos de Bloqueo por Intentos Fallidos
```typescript
// Incrementa contador de intentos fallidos
incrementFailedLoginAttempt(): void

// Resetea intentos fallidos
resetFailedLoginAttempts(): void

// Obtiene número actual de intentos
get failedLoginAttempts(): number

// Verifica si la cuenta está bloqueada
isLoginLocked(): boolean

// Obtiene minutos restantes de bloqueo
getLockRemainingMinutes(): number
```

#### Propiedades Observables
```typescript
// Usuario actual (null si no autenticado)
user$: BehaviorSubject<User | null>

// Auth listo para ser consultado
authReady$: BehaviorSubject<boolean>

// Loading state
loading$: BehaviorSubject<boolean>

// Usuario actual (acceso directo)
get currentUser(): User | null
```

#### Métodos de Utilidad
```typescript
// Obtiene mensaje de error en español según código de Firebase
getErrorMessage(error: any): string
```

---

## 🛡️ Guards

### `AuthGuard`
```typescript
// Protege rutas privadas
canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree>
canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree>
```

**Lógica:**
1. Espera a que `authReady$` sea `true`
2. Si hay usuario Y email verificado → permite acceso
3. Si hay usuario pero email NO verificado → redirige a `/auth/verify-email`
4. Si NO hay usuario → redirige a `/auth/login`

### `GuestGuard`
```typescript
// Protege rutas de autenticación (login, register, forgot-password)
canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree>
```

**Lógica:**
1. Si hay usuario Y email verificado → redirige a `/tabs`
2. Si hay usuario pero email NO verificado → redirige a `/auth/verify-email`
3. Si NO hay usuario → permite acceso

---

## 🌐 Rutas de la Aplicación

| Ruta | Componente | Guard | Descripción |
|------|-----------|-------|-------------|
| `/auth/login` | LoginPage | GuestGuard | Página de inicio de sesión |
| `/auth/register` | RegisterPage | GuestGuard | Registro de usuario |
| `/auth/forgot-password` | ForgotPasswordPage | GuestGuard | Recuperación de contraseña |
| `/auth/verify-email` | VerifyEmailPage | - | Verificación de email |
| `/tabs/tab1` | Tab1Page | AuthGuard | Vista principal (rutas disponibles) |
| `/tabs/tab2` | Tab2Page | AuthGuard | Galería de fotos |
| `/tabs/tab3` | Tab3Page | AuthGuard | Información |
| `/mapa/:recorridoId` | MapaPage | AuthGuard | Mapa de recorrido |
| `/` | - | - | Redirige a `/auth/login` |

---

## 🎯 Flujos de Usuario

### Flujo de Registro
```
1. Usuario accede a /auth/register
2. Completa formulario (nombre, email, contraseña)
3. Contraseña se valida (8+ chars, mayúscula, número, símbolo)
4. Se crea usuario en Firebase Auth
5. Se crea documento en Firestore (colección 'users')
6. Se envía email de verificación
7. Redirige a /auth/verify-email
8. Usuario verifica email (link en bandeja)
9. BehaviorSubject detecta cambio → redirige a /tabs
```

### Flujo de Login
```
1. Usuario accede a /auth/login
2. Ingresa email y contraseña
3. Si "Recordarme" está marcado → Local persistence
4. Intento de login
   a) Éxito + email verificado → redirige a /tabs
   b) Éxito + email NO verificado → redirige a /auth/verify-email
   c) Fallo → incrementa contador, muestra error
5. Después de 5 fallos → cuenta bloqueada 10 minutos
```

### Flujo de Google Sign-In
```
1. Usuario hace click en "Ingresar con Google"
2. Se abre popup de Google
3. Usuario autentica
4. Si es nuevo → se crea documento en Firestore
5. Si ya existe → se actualiza (si es necesario)
6. Redirige a /tabs (Google valida email automáticamente)
```

### Flujo de Recuperación de Contraseña
```
1. Usuario accede a /auth/forgot-password
2. Ingresa email
3. Firebase envía email de recuperación
4. Pantalla muestra "Revisa tu bandeja"
5. Usuario hace click en link del email
6. Se abre página de reset de Firebase
7. Usuario ingresa nueva contraseña
8. Redirige a /auth/login
```

---

## ⚙️ Configuración Firebase Requerida

### Métodos de Autenticación Habilitados

En Firebase Console (`proyecto-angular-dc7a2`):

1. **Email/Contraseña** ✅ (ya habilitado)
2. **Google** ✅ (debe estar habilitado)
   - OAuth 2.0 Client ID configurado
   - URI autorizados incluye localhost:4200 (desarrollo)

### Firestore

1. **Colección `users`** - Documentos por UID
   ```
   /users/{uid}
   - uid: string
   - displayName: string
   - email: string
   - createdAt: timestamp
   - emailVerified: boolean
   - photoURL: string | null
   ```

2. **Reglas de seguridad** (sugeridas):
   ```firestore
   match /users/{uid} {
     allow read, write: if request.auth.uid == uid;
   }
   ```

---

## 📋 Testing

Componentes con `.spec.ts` para pruebas:
- `login.page.spec.ts` - Validación de formulario, login, Google
- `register.page.spec.ts` - Validación de contraseña, registro
- `forgot-password.page.spec.ts` - Envío de email
- `verify-email.page.spec.ts` - Reenvío de verificación
- `auth.service.spec.ts` - Métodos del servicio
- `auth.guard.spec.ts` - Protección de rutas
- `guest.guard.spec.ts` - Redireccionamiento

---

## 🔐 Seguridad

✅ **Implementado:**
- Validación en tiempo real (email, contraseña)
- Bloqueo por intentos fallidos (5 intentos = 10 min de bloqueo)
- Verificación de email obligatoria
- Google OAuth 2.0
- `localStorage` para persistencia de sesión
- Mensajes de error genéricos (no revelan si email existe)
- Guards protegen rutas privadas
- `onAuthStateChanged()` sincroniza estado globalmente

⚠️ **Consideraciones adicionales:**
- Usar HTTPS en producción (requerido por Firebase)
- Habilitar reCAPTCHA en reglas de autenticación
- Configurar CORS en backend si hay (no aplica aquí, Firebase maneja)

---

## 🚀 Para Empezar

### 1. Verificar Google Sign-In está habilitado
```
Firebase Console → Autenticación → Proveedor → Google
```

### 2. Probar flujos
```
http://localhost:4200/auth/login     # Ir a login
http://localhost:4200/auth/register  # Ir a registro
```

### 3. Monitorear estados
```typescript
// En consola del navegador:
// Abrir DevTools → Console → Escribir:
localStorage.getItem('auth_failed_attempts')     // Ver intentos fallidos
localStorage.getItem('auth_lock_until')          // Ver timestamp de bloqueo
```

---

## 📞 Contacto & Soporte

Para preguntas sobre la implementación:
- Revisar `src/app/services/auth.service.ts` - lógica principal
- Revisar `src/app/guards/auth.guard.ts` - protección de rutas
- Revisar componentes en `src/app/auth/**/`

---

**Estado:** ✅ Completamente implementado
**Última actualización:** 2026-06-16
