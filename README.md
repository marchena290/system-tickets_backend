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
- ✅ Sistema de roles y permisos
- ✅ Gestión de usuarios
- ✅ CRUD completo de tickets

- ✅ Sistema de tickets con tipos (Redes, Software, Hardware)[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

- ✅ Estados de tickets (Abierto, En revisión, En progreso, Finalizado)

- ✅ Categorías de prioridad (Baja, Media, Alta)## Project setup

- ✅ Sistema de seguimiento de tickets

- ✅ Seeder automático de roles```bash

$ npm install

### En Desarrollo```

- ⏳ Autenticación con JWT

- ⏳ Guards por rol## Compile and run the project

- ⏳ Reportería

- ⏳ Notificaciones```bash

# development

## 📦 Instalación$ npm run start



1. **Clonar el repositorio**# watch mode

   ```bash$ npm run start:dev

   git clone <url-del-repositorio>

   cd system-tickets# production mode

   ```$ npm run start:prod

```

2. **Instalar dependencias**

   ```bash## Run tests

   npm install

   ``````bash

# unit tests

3. **Configurar variables de entorno**$ npm run test

   ```bash

   cp .env.example .env# e2e tests

   ```$ npm run test:e2e

   Editar `.env` con tus credenciales de PostgreSQL

# test coverage

4. **Crear la base de datos**$ npm run test:cov

   ```sql```

   CREATE DATABASE system_tickets;

   ```## Deployment



5. **Ejecutar la aplicación**When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

   ```bash

   npm run start:devIf you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

   ```

```bash

   La aplicación estará disponible en `http://localhost:3000`$ npm install -g @nestjs/mau

$ mau deploy

## 📊 Estructura de la Base de Datos```



### EntidadesWith Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

- **User:** Usuarios del sistema (email, nombreCompleto, cedula, departamento, contacto)

- **Rol:** Roles del sistema (Colaborador, Soportista, Supervisor)## Resources

- **Tickets:** Casos de soporte con tipos, estados y prioridades

- **Tracking:** Seguimiento y actualizaciones de ticketsCheck out a few resources that may come in handy when working with NestJS:



## 🗂️ Estructura del Proyecto- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.

- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).

```- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).

src/- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.

├── entities/           # Entidades de TypeORM- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).

│   ├── user.entity.ts- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).

│   ├── rol.entity.ts- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).

│   ├── ticket.entity.ts- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

│   └── tracking.entity.ts

├── auth/              # Módulo de autenticación## Support

│   ├── auth.module.ts

│   ├── auth.service.tsNest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

│   ├── auth.controller.ts

│   └── seed.service.ts## Stay in touch

├── tickets/           # Módulo de tickets

├── tracking/          # Módulo de seguimiento- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)

└── main.ts           # Punto de entrada- Website - [https://nestjs.com](https://nestjs.com/)

```- Twitter - [@nestframework](https://twitter.com/nestframework)



## 🛠️ Scripts Disponibles## License



```bashNest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

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
- [x] Estructura de módulos (Auth, Tickets, Tracking)

### Fase 2: Autenticación ⏳ (En desarrollo)
- [ ] Implementación de registro y login
- [ ] JWT Strategy y Guards
- [ ] Protección de rutas por rol

### Fase 3: CRUD y Lógica de Negocio
- [ ] CRUD completo de tickets
- [ ] Sistema de asignación de tickets
- [ ] Seguimiento y actualización de tickets
- [ ] Validaciones y manejo de errores

### Fase 4: Reportería y Extras
- [ ] Reportes por estado, usuario, soportista
- [ ] Upload de evidencias
- [ ] Notificaciones

### Fase 5: Frontend
- [ ] Aplicación Angular
- [ ] Integración con API

## 👥 Autor

Proyecto final - Sistema de Gestión de Tickets

## 📅 Fecha de Entrega

4 de Diciembre de 2025

## 📄 Licencia

Este proyecto es privado y con fines académicos.
