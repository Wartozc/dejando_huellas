# Dejando Huellas - Angular PWA

Aplicación web progresiva (PWA) para la **Asociación de Emprendedores Dejando Huellas de Ebéjico**.

## Características

- **PWA**: Instalable en dispositivos móviles, soporte offline
- **Autenticación**: Login con JWT, protección de rutas
- **Panel de Administración**: Gestión de miembros y publicaciones
- **Sitio Público**: Home, Nosotros, Actividades, Contacto
- **Diseño Responsivo**: Mobile-first, accesible
- **WhatsApp Integration**: Botón flotante para contacto directo

## Requisitos Previos

- Node.js 18+
- npm o yarn
- Backend API corriendo en `http://localhost:8080`

## Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd dejando_huellas/Frontend/dejando_huellas
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Edita `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',  // URL del backend
  appName: 'Dejando Huellas',
  whatsappNumber: '+573001234567',  // Tu número de WhatsApp
  installPromptDelay: 3000
};
```

4. **Ejecutar en desarrollo**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## Credenciales por Defecto (Backend)

- **Email**: `admin@dejandohuellas.com`
- **Contraseña**: `admin123`

> ⚠️ Cambia estas credenciales en producción.

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Construye la aplicación para producción |
| `npm run build:prod` | Construye con configuración de producción |
| `npm test` | Ejecuta las pruebas unitarias |

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/                    # Núcleo de la aplicación
│   │   ├── guards/              # Guards de rutas (auth, admin)
│   │   ├── interceptors/        # HTTP interceptors (auth)
│   │   ├── models/              # Modelos de datos
│   │   └── services/            # Servicios (auth, members, posts)
│   ├── shared/                  # Componentes compartidos
│   │   └── components/          # Spinner, Toast, Card, Button, etc.
│   ├── features/                 # Módulos de funcionalidad
│   │   ├── auth/               # Login, Register
│   │   ├── admin/              # Dashboard, Members, Publications
│   │   └── public/             # Home, About, Activities, Contact
│   ├── layouts/                 # Layouts principales
│   │   ├── public-layout/       # Layout público con navbar
│   │   └── admin-layout/        # Layout admin con sidebar
│   ├── app.routes.ts           # Rutas de la aplicación
│   └── app.config.ts           # Configuración de Angular
├── environments/                # Variables de entorno
├── styles.scss                  # Estilos globales
└── index.html                   # HTML principal
```

## API Endpoints

La aplicación consume las siguientes APIs del backend:

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/me` - Obtener usuario actual

### Miembros
- `POST /api/v1/members/register` - Registrar miembro
- `GET /api/v1/members` - Listar miembros (Admin)
- `PUT /api/v1/members/:id` - Actualizar miembro (Admin)
- `DELETE /api/v1/members/:id` - Eliminar miembro (Admin)
- `POST /api/v1/members/:id/approve` - Aprobar miembro (Admin)
- `POST /api/v1/members/:id/reject` - Rechazar miembro (Admin)

### Publicaciones
- `GET /api/v1/posts` - Listar publicaciones
- `GET /api/v1/posts/:id` - Ver publicación
- `POST /api/v1/posts` - Crear publicación (Admin)
- `PUT /api/v1/posts/:id` - Actualizar publicación (Admin)
- `DELETE /api/v1/posts/:id` - Eliminar publicación (Admin)

### Contacto
- `POST /api/v1/contact` - Enviar mensaje
- `GET /api/v1/contact` - Listar mensajes (Admin)

## Despliegue

### Build para Producción
```bash
npm run build:prod
```

Los archivos compilados estarán en `dist/`.

### Netlify

1. Conectar el repositorio con Netlify
2. Configurar el build command: `npm run build:prod`
3. Configurar el publish directory: `dist/dejando_huellas/browser`

### Docker (Opcional)

```dockerfile
FROM nginx:alpine
COPY dist/dejando_huellas/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## PWA

La aplicación incluye:
- Service Worker para caching offline
- Manifiesto para instalación en móvil
- Notificaciones de actualización

### Instalar en Móvil

1. Abrir la aplicación en el navegador
2. En Chrome: Menú > "Agregar a pantalla de inicio"
3. En Safari: Compartir > "Agregar a pantalla de inicio"

## Tecnologías

- **Framework**: Angular 21
- **Estilos**: SCSS
- **HTTP**: HttpClient con interceptors
- **Estado**: Angular Signals
- **PWA**: @angular/service-worker
- **Backend**: Go + Gin + MongoDB (ver repo del backend)

## Licencia

MIT
