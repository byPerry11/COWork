# Habilitar Leaked Password Protection en Supabase

## 📋 Resumen

La protección contra contraseñas filtradas (Leaked Password Protection) es una característica de seguridad de Supabase Auth que verifica las contraseñas contra la base de datos de [HaveIBeenPwned.org](https://haveibeenpwned.com/) para prevenir que los usuarios utilicen contraseñas comprometidas.

---

## 🔧 Pasos para Habilitar

### 1. Acceder al Dashboard de Supabase

1. Abre tu navegador y ve a: [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **TPVapp** (o el nombre correspondiente)

### 2. Navegar a la Configuración de Authentication

1. En el menú lateral izquierdo, haz clic en **Authentication**
2. Selecciona la pestaña **Policies** o **Configuration**

### 3. Habilitar la Protección

1. Busca la sección **"Password strength and leaked password protection"**
2. Activa el toggle o checkbox para:
   - ✅ **"Check passwords against HaveIBeenPwned.org database"**
   - O similar: **"Enable leaked password protection"**
3. Guarda los cambios (si hay un botón "Save" o se aplica automáticamente)

---

## ✅ Verificación

Para confirmar que la protección está activa:

### Prueba 1: Contraseña Comprometida

1. Intenta crear una nueva cuenta con una contraseña común conocida por estar filtrada:

   - `password123`
   - `qwerty123`
   - `admin123`

2. **Resultado esperado**: Deberías recibir un error indicando que la contraseña ha sido comprometida

### Prueba 2: Contraseña Segura

1. Intenta crear una cuenta con una contraseña fuerte y única:

   - Ejemplo: `Kx9$mP2@vL5#nQ8`

2. **Resultado esperado**: La cuenta debería crearse exitosamente

---

## 📝 Notas Adicionales

- **Privacidad**: HaveIBeenPwned usa k-anonymity, por lo que tu contraseña nunca se envía completa
- **Performance**: La verificación añade una latencia mínima (~100-200ms)
- **Recomendación**: Siempre mantén esta configuración habilitada en producción

---

## 🔗 Referencias

- [Documentación oficial de Supabase - Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
