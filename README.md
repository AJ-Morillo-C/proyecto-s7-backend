# 📚 Sistema de Gestión de Biblioteca Digital

Backend API para una plataforma completa de gestión y distribución de libros digitales, desarrollada con NestJS, TypeORM y PostgreSQL. Sistema modular con autenticación JWT, gestión de contenido, interacciones sociales y almacenamiento en la nube.

## 🏗️ Arquitectura del Sistema

El sistema sigue una arquitectura modular NestJS con separación clara de responsabilidades:

- **Capa HTTP**: Controladores para Auth, Books, Authors, Users, Reviews, Favorites
- **Capa de Lógica de Negocio**: Servicios especializados para cada dominio
- **Servicios de Soporte**: CloudinaryService, MailerService, ValidEmailService
- **Capa de Datos**: Repositorios TypeORM con PostgreSQL

## 🚀 Características Principales

### Gestión de Contenido

- **Catálogo completo de libros**: Búsqueda, filtrado, paginación y descarga
- **Gestión de autores**: Perfiles con biografías y fotografías
- **Editoriales y géneros**: Clasificación y organización del contenido
- **Almacenamiento de archivos**: Integración con Cloudinary para PDFs y imágenes

### Sistema de Usuarios

- **Autenticación JWT**: Tokens en cookies y headers Authorization
- **Autorización basada en roles**: USER/ADMIN con protección por defecto
- **Gestión de perfiles**: Fotos de perfil y datos personales
- **Recuperación de contraseña**: Sistema de tokens con expiración

### Interacciones Sociales

- **Sistema de reseñas**: Calificaciones y comentarios por usuario
- **Favoritos**: Gestión de libros favoritos por usuario
- **Métricas**: Tracking de visualizaciones y descargas

### Comunicación

- **Sistema de email**: NodeMailer con plantillas personalizadas
- **Validación de emails**: Servicio de verificación integrado

## 🛠️ Stack Tecnológico

- **Framework**: NestJS con TypeScript
- **ORM**: TypeORM con estrategias de naming
- **Base de datos**: PostgreSQL con UUID y soft deletion
- **Autenticación**: JWT con Passport.js strategies
- **Validación**: class-validator con transformation pipes
- **Almacenamiento**: Cloudinary para archivos y media
- **Email**: NodeMailer con templates
- **Contenedorización**: Docker y Docker Compose

## 📊 Esquema de Base de Datos

Entidades principales con relaciones:

- `user` → `review`, `favorite`
- `book` ← `author`, `editorial`, `gender`
- `review` ← `user`, `book`
- `favorite` ← `user`, `book`

Características: UUIDs, timestamps automáticos, soft deletion con `is_active`

## 🔐 Seguridad y Autenticación

- **Seguridad por defecto**: Todos los endpoints requieren autenticación
- **Acceso público explícito**: Decorator `@PublicAccess()` para endpoints públicos
- **JWT Strategy**: Extracción de tokens desde cookies (`access-token`) y headers
- **Validación de usuarios**: `AuthService.validateUserById()`

### Endpoints Públicos

- Registro y login (`/auth/register`, `/auth/login`)
- Navegación de libros (`/books`, `/books/search`)
- Navegación de autores (`/authors`, `/authors/search`)
- Descarga de libros (`/books/:id/download`)

## 📋 Requisitos

- Node.js (v14 o superior)
- PostgreSQL
- Cuenta en Cloudinary
- Variables de entorno configuradas

## 🔧 Instalación y Configuración

```bash
# Clonar el repositorio  [header-3](#header-3)
git clone https://github.com/AJ-Morillo-C/proyecto-s7-backend.git

# Instalar dependencias  [header-4](#header-4)
cd proyecto-s7-backend
npm install

# Configurar variables de entorno  [header-5](#header-5)
cp .env.example .env.development
# Configurar credenciales de PostgreSQL, Cloudinary, JWT, Email  [header-6](#header-6)

# Iniciar base de datos con Docker  [header-7](#header-7)
docker-compose up -d

# Ejecutar migraciones (si es necesario)  [header-8](#header-8)
npm run m:run:dev

# Iniciar servidor en desarrollo  [header-9](#header-9)
npm run start:dev
```

## 📡 API y Respuestas

### Estructura de Respuestas Estandarizada

- **Entidad única**: `OneApiResponse<T>` con status y data
- **Colecciones**: `AllApiResponse<T>` con status, meta (paginación) y data
- **Datos agrupados**: `GroupedApiResponse<T>` para datos categorizados

### Paginación Uniforme

Todos los endpoints de colección soportan `PaginationDto` con `page`, `limit` y parámetros de búsqueda opcionales.

## 🗂️ Estructura de Módulos

AppModule <br>
├── AuthModule → UsersModule, MailerModule <br>
├── BooksModule → CloudinaryModule <br>
├── AuthorsModule → CloudinaryModule <br>
├── ReviewsModule → BooksModule <br>
├── FavoritesModule → BooksModule <br>
└── MailerModule → ValidEmailModule

## 🚀 Scripts Disponibles

```bash
npm run start:dev      # Desarrollo con watch
npm run start:prod     # Producción
npm run build          # Compilar
npm run test           # Tests unitarios
npm run test:e2e       # Tests end-to-end
npm run m:gen:dev      # Generar migración (dev)
npm run m:run:dev      # Ejecutar migraciones (dev)
```

## 📄 Licencia

Este proyecto está bajo licencia UNLICENSED

---

**Autor:** Ali Morillo <br>
**Versión:** 1.0.0 <br>
Desarrollado como plataforma completa de gestión de biblioteca digital con arquitectura escalable y moderna. <br>
**Para mayor informacón →** [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/AJ-Morillo-C/proyecto-s7-backend) **←**
