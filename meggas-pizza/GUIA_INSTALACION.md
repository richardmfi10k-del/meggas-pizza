# 🍕 Megga's Pizza — Guía de instalación completa

## Qué incluye este proyecto

| URL | Pantalla |
|-----|---------|
| `/` | Menú del cliente (hace el pedido) |
| `/cocina` | Pantalla de cocina en tiempo real |
| `/admin/login` | Acceso al panel del dueño |
| `/admin` | Panel: editar sabores, precios, configuración |

---

## PASO 1 — Crear proyecto en Firebase (gratis)

1. Ve a **https://console.firebase.google.com**
2. Clic en **"Crear un proyecto"**
3. Nombre: `meggas-pizza` → Siguiente → Crear
4. En el panel del proyecto, clic en el ícono **`</>`** (Web app)
5. Nombre la app: `meggas-pizza-web` → **Registrar app**
6. Copia el objeto `firebaseConfig` que aparece (tiene apiKey, projectId, etc.)

### Activar Firestore
1. En el menú izquierdo → **Firestore Database**
2. Clic **"Crear base de datos"**
3. Elige **"Modo de prueba"** → Siguiente → Crear

### Reglas de seguridad para Firestore
En Firestore → pestaña **Reglas**, pega esto y publica:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Estas reglas son para empezar. Cuando el negocio esté activo, cámbialas por reglas más seguras.

---

## PASO 2 — Configurar Firebase en el proyecto

Abre el archivo **`src/firebase.js`** y reemplaza los valores:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← pega tu valor real
  authDomain: "meggas-pizza.firebaseapp.com",
  projectId: "meggas-pizza",
  storageBucket: "meggas-pizza.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## PASO 3 — Publicar en Vercel (gratis)

### Opción A — Desde GitHub (recomendada)
1. Sube la carpeta `meggas-pizza` a un repositorio en **https://github.com**
2. Ve a **https://vercel.com** → Sign up con tu cuenta de GitHub
3. Clic **"New Project"** → Importa tu repositorio
4. Vercel detecta React automáticamente → clic **"Deploy"**
5. En ~2 minutos tienes tu URL: `meggas-pizza.vercel.app`

### Opción B — Desde tu computador con la terminal
```bash
npm install -g vercel
cd meggas-pizza
npm install
vercel
```
Sigue las instrucciones en pantalla.

---

## PASO 4 — Configurar WhatsApp Business

1. Descarga **WhatsApp Business** en el celular del negocio
2. Ve a: Ajustes → Herramientas para la empresa → **Mensaje de bienvenida**
3. Actívalo y escribe:
   ```
   Hola 👋 Bienvenido a Megga's Pizza!
   Haz tu pedido aquí 🍕
   https://TU-URL.vercel.app
   ```
4. Cada cliente que escriba recibirá el link automáticamente.

---

## PASO 5 — Uso diario

### Para el dueño (panel admin)
- URL: `https://TU-URL.vercel.app/admin/login`
- Contraseña por defecto: `meggas2024`
- **Cambiar contraseña:** Admin → Configuración → Editar → Nueva contraseña

### Para la cocina
- URL: `https://TU-URL.vercel.app/cocina`
- Abre en la tablet o computador de la pizzería
- Deja la pantalla siempre abierta

### Para los clientes
- URL: `https://TU-URL.vercel.app`
- Esta es la URL que vas a compartir por WhatsApp

---

## Qué puede editar el dueño en el panel admin

| Sección | Qué puede hacer |
|---------|----------------|
| **Sabores** | Agregar, editar nombre e ingredientes, eliminar |
| **Tamaños** | Cambiar precio, nombre y porciones de cada tamaño |
| **Configuración** | Cambiar teléfono, costo del domicilio, contraseña |

---

## Preguntas frecuentes

**¿Se puede usar sin internet?**
No. Necesita internet para guardar y mostrar pedidos en tiempo real.

**¿Cuánto cuesta?**
Firebase gratis hasta ~50.000 lecturas/día. Vercel gratis para proyectos personales. Para un negocio con volumen normal, es completamente gratis.

**¿Se puede usar para otro negocio?**
Sí. Duplica el proyecto, cambia el nombre y Firebase config. El código ya está preparado para SaaS.

**¿Cómo backup de pedidos?**
Todos los pedidos quedan guardados en Firebase Firestore. Puedes verlos desde la consola de Firebase.

---

## Soporte
Número configurado: **310 578 05 03**
