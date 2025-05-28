# Sistema de Gestión de Gimnasios SaaS

Backend para un sistema de gestión de gimnasios con arquitectura SaaS.

## Características

- Autenticación y autorización de usuarios
- Gestión de gimnasios
- Gestión de estudiantes
- Gestión de planes de membresía
- Sistema de check-in
- Análisis y estadísticas
- Documentación API con Swagger

## Requisitos

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/gym-saas-backend.git
cd gym-saas-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```
Editar el archivo `.env` con tus configuraciones.

4. Iniciar el servidor:
```bash
npm run dev
```

## Estructura del Proyecto

```
src/
  ├── controllers/     # Controladores de la aplicación
  ├── middleware/      # Middleware personalizado
  ├── models/         # Modelos de Mongoose
  ├── routes/         # Rutas de la API
  ├── utils/          # Utilidades y helpers
  ├── index.js        # Punto de entrada
  └── swagger.json    # Documentación de la API
```

## API Endpoints

### Autenticación
- POST /api/auth/register - Registrar nuevo usuario
- POST /api/auth/login - Iniciar sesión
- POST /api/auth/change-password - Cambiar contraseña
- POST /api/auth/forgot-password - Solicitar restablecimiento de contraseña
- POST /api/auth/reset-password - Restablecer contraseña

### Gimnasios
- POST /api/gyms - Crear nuevo gimnasio
- GET /api/gyms - Listar gimnasios
- GET /api/gyms/:id - Obtener gimnasio
- PUT /api/gyms/:id - Actualizar gimnasio
- DELETE /api/gyms/:id - Eliminar gimnasio

### Estudiantes
- POST /api/students - Registrar nuevo estudiante
- GET /api/students - Listar estudiantes
- GET /api/students/:id - Obtener estudiante
- PUT /api/students/:id - Actualizar estudiante
- DELETE /api/students/:id - Eliminar estudiante

### Planes de Membresía
- POST /api/membership-plans - Crear nuevo plan
- GET /api/membership-plans - Listar planes
- GET /api/membership-plans/:id - Obtener plan
- PUT /api/membership-plans/:id - Actualizar plan
- DELETE /api/membership-plans/:id - Eliminar plan

### Check-ins
- POST /api/check-ins - Registrar check-in
- GET /api/check-ins - Listar check-ins
- GET /api/check-ins/:id - Obtener check-in
- GET /api/check-ins/student/:studentId - Obtener check-ins de estudiante

### Análisis
- GET /api/analytics/daily - Análisis diario
- GET /api/analytics/weekly - Análisis semanal
- GET /api/analytics/monthly - Análisis mensual
- GET /api/analytics/check-ins - Estadísticas de check-ins
- GET /api/analytics/students - Estadísticas de estudiantes
- GET /api/analytics/revenue - Estadísticas de ingresos

## Documentación

La documentación completa de la API está disponible en `/api-docs` cuando el servidor está en ejecución.

## Licencia

MIT 