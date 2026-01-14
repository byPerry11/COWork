# Configuración de Push Notifications

Esta aplicación soporta notificaciones push en tiempo real, pero requiere configuración de VAPID keys.

## Estado Actual

❌ **Las push notifications NO están configuradas actualmente**

El error que aparece al intentar habilitarlas se debe a que faltan las **VAPID keys** necesarias para enviar notificaciones push web.

## ¿Qué son VAPID Keys?

VAPID (Voluntary Application Server Identification) es un estándar que permite que tu servidor se identifique ante el servicio de push del navegador. Requiere un par de llaves (pública/privada).

## Cómo Configurar

### Paso 1: Generar VAPID Keys

Puedes generar las keys usando `web-push` de Node.js:

```bash
# Instalar web-push globalmente
npm install -g web-push

# Generar las keys
web-push generate-vapid-keys
```

Esto generará algo como:

```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls

=======================================
```

### Paso 2: Configurar Variables de Entorno

Agrega las siguientes variables al archivo `.env.local`:

```env
# VAPID Keys para Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<tu-public-key-aqui>
VAPID_PRIVATE_KEY=<tu-private-key-aqui>
```

**Importante:**
- La **Public Key** tiene el prefijo `NEXT_PUBLIC_` así que está disponible en el cliente
- La **Private Key** NO tiene prefijo `NEXT_PUBLIC_` para mantenerla secreta en el servidor

### Paso 3: Configurar en Vercel (Producción)

Si estás desplegando en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega las dos variables:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`

### Paso 4: Crear la Tabla en Supabase

Ejecuta este SQL en Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON push_subscriptions(user_id);

-- Habilitar RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias suscripciones
CREATE POLICY "Users can view own subscriptions"
ON push_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias suscripciones
CREATE POLICY "Users can insert own subscriptions"
ON push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias suscripciones
CREATE POLICY "Users can delete own subscriptions"
ON push_subscriptions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias suscripciones
CREATE POLICY "Users can update own subscriptions"
ON push_subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
```

### Paso 5: Reiniciar el Servidor de Desarrollo

```bash
# Detén el servidor actual (Ctrl+C)
# Reinicia
npm run dev
```

## Verificación

Una vez configurado correctamente:

1. Ve a **Settings** en la app
2. Busca la sección **Notifications**
3. Haz clic en **Enable** 
4. El navegador te pedirá permiso
5. Si todo está bien, verás "Push notifications enabled!"

## Troubleshooting

### Error: "VAPID public key not configured"
- Verifica que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` esté en `.env.local`
- Reinicia el servidor de desarrollo

### Error: 500 al guardar la suscripción
- Verifica que `VAPID_PRIVATE_KEY` esté configurada
- Verifica que la tabla `push_subscriptions` exista en Supabase

### Error: "Service Worker registration failed"
- Verifica que el archivo `/public/sw.js` exista
- Verifica que la app esté en HTTPS (en producción)

## Notas de Seguridad

⚠️ **NUNCA** compartas la `VAPID_PRIVATE_KEY` públicamente
⚠️ **NUNCA** la subas a Git (está en `.gitignore`)
⚠️ Solo la `NEXT_PUBLIC_VAPID_PUBLIC_KEY` es segura para compartir

## ¿Cómo funcionan las Push Notifications?

```
1. Usuario habilita notificaciones
   ↓
2. Navegador solicita suscripción al Push Service
   ↓
3. Push Service devuelve endpoint + keys
   ↓
4. Se guarda en Supabase (push_subscriptions)
   ↓
5. Cuando ocurre un evento (ej: invitación a proyecto)
   ↓
6. Servidor llama a /api/push/send con el user_id
   ↓
7. API busca las suscripciones del usuario
   ↓
8. Envía notificación a cada endpoint usando VAPID private key
   ↓
9. Push Service entrega al navegador del usuario
   ↓
10. Service Worker muestra la notificación
```

## Estado de las Funciones de Notificación

- ✅ Sistema de notificaciones en base de datos funcionando
- ✅ Popover de notificaciones funcionando
- ✅ Notificaciones en tiempo real (Supabase Realtime)
- ❌ **Push notifications (requiere configuración VAPID)**

