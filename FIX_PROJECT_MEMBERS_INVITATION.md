# Fix Project Members Invitation Error

## Problema

Al intentar invitar usuarios a un proyecto, se genera un error 500 porque el código intenta insertar columnas que no existen en la tabla `project_members`:
- `status` (para manejar invitaciones pendientes/aceptadas/rechazadas)
- `member_color` (para asignar colores a los miembros en la UI)

## Solución

Ejecuta el siguiente SQL en **Supabase SQL Editor**:

```sql
-- =========================================================
-- FIX: Agregar columnas faltantes a project_members
-- =========================================================

-- 1. Agregar columna 'status' para manejar invitaciones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'project_members'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE project_members
        ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected'));
    END IF;
END $$;

-- 2. Agregar columna 'member_color' para UI
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'project_members'
        AND column_name = 'member_color'
    ) THEN
        ALTER TABLE project_members
        ADD COLUMN member_color TEXT DEFAULT '#3b82f6';
    END IF;
END $$;

-- 3. Actualizar miembros existentes a 'active' si son NULL
UPDATE project_members
SET status = 'active'
WHERE status IS NULL;

-- 4. Verificar las columnas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'project_members'
ORDER BY ordinal_position;
```

## Verificación

Después de ejecutar el script, deberías ver las columnas:
- `project_id`
- `user_id`
- `role`
- `joined_at`
- `status` ✅ (nueva)
- `member_color` ✅ (nueva)

## Probando la funcionalidad

1. Ve a un proyecto
2. Click en el ícono de "Manage Members" (UserPlus)
3. Busca y selecciona un usuario
4. Asigna un rol (Member/Manager/Admin)
5. Click en "Add Member"
6. Debería ver: ✅ "Invitación enviada correctamente"

## Notas

- Las invitaciones ahora comienzan con `status: 'pending'`
- El usuario invitado recibirá una notificación
- Puede aceptar/rechazar desde el dashboard
- Los colores de miembros se asignan automáticamente para mejorar la UI
