# Sistema de Gestión de Tickets 🎫

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

Sistema de soporte técnico para gestión de tickets con roles diferenciados (Colaborador, Soportista, Supervisor).

## 📋 Descripción

Sistema desarrollado para una empresa de soporte de software y hardware ubicada en Centro América y el Caribe, con 5000 colaboradores y un departamento de TI centralizado en Costa Rica.

## 🚀 Tecnologías

- **Backend:** NestJS
- **Base de datos:** PostgreSQL
- **ORM:** TypeORM
- **Lenguaje:** TypeScript
- **Autenticación:** JWT

## ✨ Características

### Roles del Sistema

- **Colaborador:** Puede crear tickets y ver el estado de sus casos
- **Soportista:** Atiende tickets, asigna prioridades y da seguimiento
- **Supervisor:** Administra usuarios, roles y asigna tickets a soportistas

### Funcionalidades Implementadas

- ✅ Sistema de autenticación JWT
- ✅ Sistema de roles y permisos (COLABORADOR, SOPORTISTA, SUPERVISOR)
- ✅ Gestión de usuarios con seeder automático
- ✅ CRUD completo de tickets con permisos por rol
- ✅ Sistema de tickets con tipos (Redes, Software, Hardware)
- ✅ Estados de tickets (Abierto, En revisión, En progreso, Finalizado)
- ✅ Categorías de prioridad (Baja, Media, Alta)
- ✅ Sistema de seguimiento (Tracking) con historial inmutable
- ✅ Validaciones completas con class-validator

### Reportería

- ✅ Módulo de reportería y estadísticas (tickets por estado, usuario, soportista, resumen)

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/marchena290/system-tickets_backend.git
   cd system-tickets
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tus credenciales de PostgreSQL

4. **Crear la base de datos**
   ```sql

   CREATE DATABASE system_tickets;
   ```

5. **Ejecutar la aplicación**
   ```bash
   npm run start:dev
   ```
   La aplicación estará disponible en `http://localhost:3000`

## 📊 Estructura de la Base de Datos

### Entidades

- **User:** Usuarios del sistema (email, nombreCompleto, cedula, departamento, contacto)
- **Rol:** Roles del sistema (Colaborador, Soportista, Supervisor)
- **Tickets:** Casos de soporte con tipos, estados y prioridades
- **Tracking:** Seguimiento y actualizaciones de tickets

## 🗂️ Estructura del Proyecto

```
src/
├── entities/           # Entidades de TypeORM
│   ├── user.entity.ts
│   ├── rol.entity.ts
│   ├── ticket.entity.ts
│   └── tracking.entity.ts
├── auth/              # Módulo de autenticación
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts
│   ├── guards/        # Guards JWT
│   ├── decorators/    # Decorador GetUser
│   └── seed.service.ts
├── tickets/           # Módulo de tickets
│   ├── tickets.module.ts
│   ├── tickets.service.ts
│   ├── tickets.controller.ts
│   └── dto/
├── tracking/          # Módulo de seguimiento
│   ├── tracking.module.ts
│   ├── tracking.service.ts
│   ├── tracking.controller.ts
│   └── dto/
└── main.ts           # Punto de entrada
```

## 🔗 Endpoints API

### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión (retorna JWT)

### Tickets
- `POST /tickets` - Crear ticket (requiere JWT)
- `GET /tickets` - Listar tickets (filtrado por rol)
- `GET /tickets/:id` - Ver detalles de ticket
- `PATCH /tickets/:id` - Actualizar ticket
- `DELETE /tickets/:id` - Eliminar ticket (solo SUPERVISOR)

### Tracking
- `POST /tracking` - Crear seguimiento (requiere JWT)
- `GET /tracking/ticket/:ticketId` - Ver seguimientos de un ticket

### Reportes (solo SUPERVISOR)
- `GET /reports/tickets-by-status` - Tickets agrupados por estado
- `GET /reports/tickets-by-user` - Tickets agrupados por usuario
- `GET /reports/tickets-by-soportista` - Tickets agrupados por soportista
- `GET /reports/summary` - Resumen general de tickets

## 🛠️ Scripts Disponibles

```bash

# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Tests
npm run test

# Linting
npm run lint
```

## 📝 Progreso del Proyecto

### Fase 1: Fundamentos ✅ (Completado - 8 Nov 2025)
- [x] Configuración inicial del proyecto
- [x] Configuración de TypeORM y PostgreSQL
- [x] Creación de entidades y relaciones
- [x] Sistema de seeding para datos iniciales
- [x] Estructura de módulos (Auth, Tickets, Tracking, Reports)

### Fase 2: Autenticación ✅ (Completado - 11 Nov 2025)
- [x] Implementación de registro y login
- [x] JWT Strategy y Guards
- [x] Protección de rutas por rol
- [x] Decorador personalizado GetUser

### Fase 3: CRUD y Lógica de Negocio ✅ (Completado - 13 Nov 2025)
- [x] CRUD completo de tickets con permisos por rol
- [x] Sistema de asignación de tickets
- [x] Seguimiento y actualización de tickets (Tracking)
- [x] Validaciones y manejo de errores
- [x] Historial inmutable de seguimientos


### Fase 4: Reportería y Extras ✅ (Completado - 14 Nov 2025)
- [x] Reportes por estado, usuario, soportista
- [x] Estadísticas para SUPERVISOR
- [ ] Upload de evidencias (opcional)

### Fase 5: Frontend (Pendiente)
- [ ] Aplicación Angular
- [ ] Integración con API

## 👥 Usuarios de Prueba

El sistema incluye usuarios de prueba (generados por seeder):

- **Colaborador:** juan.perez@empresa.com / 123456
- **Soportista:** carlos.lopez@empresa.com / 123456
- **Supervisor:** supervisor@empresa.com / 123456

## 👥 Autor

Proyecto final - Sistema de Gestión de Tickets

## 📅 Fecha de Entrega

4 de Diciembre de 2025

## 🛡️ Notas de Seguridad y Limpieza

El proyecto fue limpiado de dependencias innecesarias y vulnerabilidades críticas/altas usando `npm audit fix --force`. Solo quedan advertencias moderadas en dependencias de testing, que no afectan la operación ni la seguridad del backend.

## 📄 Licencia

Este proyecto es privado y con fines académicos.
