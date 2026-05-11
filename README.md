<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">Sistema de Gestión de Tickets (HelpDesk API)</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Estado-FINALIZADO-success?style=for-the-badge" alt="Estado">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS">
  <img src="https://img.shields.io/badge/PostgreSQL-v14-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/TypeScript-v5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TS">
</p>

## 📝 Descripción

Backend robusto para soporte técnico construido con **NestJS**. Esta API REST proporciona una solución integral para la administración de tickets, seguimiento inmutable, reportería avanzada y control de acceso basado en roles (RBAC).

---

## 🛠️ Stack Técnico

| Tecnología | Logo | Descripción |
| :--- | :---: | :--- |
| **NestJS** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nestjs/nestjs-original.svg" width="25"> | Framework progresivo de Node.js. |
| **PostgreSQL** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg" width="25"> | Base de datos relacional. |
| **TypeORM** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/sequelize/sequelize-original.svg" width="25"> | ORM para la gestión de datos. |
| **JWT** | <img src="https://img.shields.io/badge/JWT-black?style=flat-square&logo=json-web-tokens" width="50"> | Seguridad y autenticación. |

---

## 🚀 Características Principales

✅ **Seguridad:** Autenticación y autorización mediante **JWT**.
👥 **Gestión de Roles:** Roles: `COLABORADOR`, `SOPORTISTA`, y `SUPERVISOR`.
🎫 **Ciclo de Tickets:** CRUD con reglas de negocio por rol.
🕵️‍♂️ **Auditoría:** Historial de *tracking* inmutable para cada ticket.
📊 **Reportería:** Dashboard de métricas y reportes filtrables.
📧 **Email:** Envío de reportes automatizados vía Nodemailer.

---

## 📋 Requisitos Previos

*   [Node.js](https://nodejs.org/) v20+
*   [npm](https://www.npmjs.com/) v10+
*   [PostgreSQL](https://www.postgresql.org/) v14+ activo

---

## ⚙️ Configuración Rápida

Sigue estos comandos en tu terminal para levantar el proyecto:

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar entorno:**
    ```bash
    cp .env.example .env
    ```

3.  **Iniciar servidor (Desarrollo):**
    ```bash
    npm run start:dev


> 💡 **Nota:** El servidor corre en el puerto `4200` por defecto.

---

## 🗺️ Endpoints Principales

### 🔑 Autenticación
*   `POST /auth/register` | `POST /auth/login`

### 🎫 Tickets
*   `POST /tickets` - Crear | `GET /tickets` - Listar | `PATCH /tickets/:id` - Actualizar

### 📊 Reportes
*   `GET /reports/summary/status` - Métricas por estado.
*   `POST /dashboard/send-report` - Enviar reporte por email.

---

## 🛡️ Seguridad y Auditoría (GitHub)

### ✅ Subir al Repo
*   `src/`, `test/`, `package.json`, `.env.example`, `README.md`.

### ❌ NO Subir (Ignorar)
*   `.env`, `node_modules/`, `dist/`, `uploads/*`.

> **Limpieza:** Si subiste archivos accidentales a `uploads/`, ejecuta:  
> `git rm -r --cached uploads/`

---

## 📄 Licencia

Uso académico / privado. 2025.
