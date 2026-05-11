# Sistema de Gestion de Tickets

Backend de soporte tecnico construido con NestJS para la administracion de tickets, seguimiento, reporteria, dashboard y control por roles.

Estado del proyecto: FINALIZADO
Fecha de cierre funcional: 2025

## Resumen

El sistema cubre el flujo completo de mesa de ayuda:

- Autenticacion y autorizacion con JWT
- Roles: COLABORADOR, SOPORTISTA, SUPERVISOR
- CRUD de tickets con reglas por rol
- Historial de tracking inmutable por ticket
- Reportes filtrables por fecha/estado/categoria
- Dashboard de metricas
- Envio de reporte por correo
- Servido de archivos estaticos desde /uploads

## Stack Tecnico

- NestJS 11
- TypeScript
- PostgreSQL
- TypeORM
- JWT + Passport
- class-validator
- Nodemailer

## Modulos Principales

- auth
- users
- tickets
- tracking
- reports
- dashboard
- email

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Configuracion Rapida

1. Clonar repositorio.
2. Instalar dependencias con npm install.
3. Copiar variables de entorno desde .env.example hacia .env.
4. Crear la base de datos system_tickets en PostgreSQL.
5. Ejecutar npm run start:dev.

Nota: el puerto por defecto del servidor es 4200 si PORT no esta definido.

## Variables de Entorno

Basadas en .env.example:

- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_TICKETS
- PORT

## Scripts

- npm run start:dev
- npm run build
- npm run start:prod
- npm run test
- npm run test:e2e
- npm run lint

## Endpoints Relevantes

Autenticacion:

- POST /auth/register
- POST /auth/login

Tickets:

- POST /tickets
- GET /tickets
- GET /tickets/:id
- PATCH /tickets/:id
- DELETE /tickets/:id

Tracking:

- POST /tracking
- GET /tracking/ticket/:ticketId

Reportes:

- GET /reports/tickets/total
- GET /reports/tickets/summary/status
- GET /reports/tickets/summary/category
- GET /reports/tickets/by-status
- GET /reports/tickets/by-soportista
- GET /reports/tickets/by-user
- GET /reports/tickets/list
- GET /reports/tickets/summary

Dashboard:

- GET /dashboard/metrics
- POST /dashboard/send-report

## Auditoria GitHub

Esta seccion define que SI y que NO debe subirse a GitHub en este proyecto.

### Debe subirse

- Codigo fuente en src y test
- Configuracion de proyecto (package.json, tsconfig, nest-cli, eslint)
- .env.example (sin secretos)
- Migraciones SQL
- Coleccion Postman
- README
- .gitignore

### No debe subirse

- .env
- node_modules
- dist
- uploads con imagenes o evidencias reales
- Archivos de respaldo tipo .bak
- Reportes locales como npm-audit.json
- Logs temporales

### Cambios aplicados para proteger el repositorio

- Se actualizaron reglas en .gitignore para ignorar uploads/* y conservar solo uploads/.gitkeep.
- Se agrego uploads/.gitkeep para mantener la carpeta sin versionar archivos adjuntos.
- Se ignoran archivos .bak y npm-audit.json.

### Limpieza recomendada antes de proximo push

Si algun archivo ya quedo trackeado antes de estas reglas, hay que sacarlo del indice de Git con comandos de limpieza (sin borrar local), por ejemplo sobre uploads.

## Seguridad

- Nunca subir credenciales reales.
- Rotar secretos si en algun momento se expusieron.
- Mantener dependencias actualizadas y revisar npm audit de forma periodica.

## Licencia

Uso academico/privado.
