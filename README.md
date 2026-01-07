# TPV-Cowork 🚀

**Sistema de Gestión de Proyectos Colaborativos con Gamificación**

Una aplicación web moderna para la gestión de proyectos industriales y tareas colaborativas, con seguimiento de avances porcentuales, verificación de checkpoints, gestión de evidencias y sistema de logros.

---

## 🌟 Características Principales

### 📊 Gestión de Proyectos
- **Creación y administración** de proyectos con fechas y límites de usuarios
- **Roles de equipo**: Admin, Manager, Member
- **Estados de proyecto**: Activo, Completado, Archivado
- **Dashboard visual** con estadísticas en tiempo real

### ✅ Sistema de Checkpoints
- Verificación por etapas de proyectos
- Seguimiento porcentual de completitud
- Orden personalizable de tareas
- Validación con evidencias fotográficas

### 📸 Gestión de Evidencias
- Subida de imágenes con notas
- Almacenamiento en Supabase Storage
- Vinculación directa a checkpoints
- Historial de verificaciones

### 👥 Colaboración en Equipo
- Sistema de invitaciones a proyectos
- Roles diferenciados (Admin/Manager/Member)
- Gestión de permisos por proyecto
- Asignación de miembros

### 🏆 Sistema de Logros (Gamificación)
- **8 logros básicos** con niveles Bronze, Silver, Gold y Platinum
- Seguimiento automático de progreso
- Medallas desbloqueables:
  - 🥉 Primer Proyecto
  - 🥉 Colaborador
  - 🥈 Primer Éxito
  - 🥈 Productivo (5 proyectos)
  - 🥈 Verificador (10 checkpoints)
  - 🥇 Equipo Fuerte (5 colaboraciones)
  - 🥇 Experto (10 proyectos)
  - 💎 Master (25 proyectos)

### 👤 Perfiles de Usuario
- Edición de nombre de usuario y nombre para mostrar
- Subida de foto de perfil
- Vista de logros obtenidos y pendientes
- Personalización visual

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 16** (App Router con Turbopack)
- **React 19** con TypeScript
- **Tailwind CSS 4** para estilos
- **shadcn/ui** para componentes UI
- **Radix UI** para primitivos accesibles
- **Lucide React** para iconografía
- **Sonner** para notificaciones toast

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage)
- Row Level Security (RLS) para seguridad
- Storage buckets para evidencias y avatares

### Validación & Forms
- **Zod** para validación de esquemas
- **React Hook Form** para manejo de formularios

---

## 🚀 Deployment

### Producción
- **Vercel**: [https://tpv-cowork.vercel.app](https://tpv-cowork.vercel.app)
- Deploy automático desde `main` branch
- Variables de entorno configuradas en Vercel

### Variables de Entorno Requeridas
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales
- **profiles**: Perfiles de usuario (username, avatar_url, display_name)
- **projects**: Proyectos (title, owner, status, dates)
- **project_members**: Relación usuarios-proyectos con roles
- **checkpoints**: Tareas/verificaciones de proyectos
- **evidences**: Evidencias fotográficas de checkpoints
- **achievements**: Definición de logros
- **user_achievements**: Logros desbloqueados por usuario

### Storage Buckets
- **evidences**: Imágenes de evidencias (público)
- **avatars**: Fotos de perfil de usuarios (público)

---

## 📦 Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/byPerry11/TPV-Cowork.git
cd TPV-Cowork/temp-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

---

## 🗃️ Configuración de Base de Datos

1. Ejecutar `database_schema.sql` en Supabase SQL Editor
2. Ejecutar `achievements_migration.sql` para sistema de logros
3. Configurar políticas RLS según necesidades de seguridad
4. Crear buckets de storage (`evidences`, `avatars`)

---

## 📱 Páginas Principales

- **`/login`**: Autenticación de usuarios
- **`/dashboard`**: Panel principal con proyectos y estadísticas
- **`/projects/[id]`**: Detalle de proyecto con checkpoints
- **`/profile`**: Perfil de usuario y logros

---

## 🎨 Características UI/UX

- **Modo oscuro** automático
- Diseño **responsive** (desktop, tablet, mobile)
- Animaciones suaves con Tailwind
- Componentes accesibles (ARIA labels)
- Feedback visual con toasts
- Skeleton loaders para mejor UX

---

## 📄 Licencia

MIT License - Ver archivo `LICENSE` para más detalles

---

## 👨‍💻 Autor

**byPerry11**

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**⭐ Si te gusta este proyecto, dale una estrella en GitHub!**
