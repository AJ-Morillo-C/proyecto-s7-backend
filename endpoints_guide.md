# Guía de Endpoints e Integración para el Frontend

Esta guía detalla el funcionamiento de todos los endpoints de la API, sus parámetros de entrada, estructuras de datos (DTOs), reglas de autenticación y flujos de trabajo recomendados para el desarrollo frontend.

---

## 🔐 Reglas de Autenticación y Autorización

La API cuenta con un sistema de autenticación global basado en **JWT** y un control de roles (`ADMIN` y `USER`).

1. **Protección por Defecto**: Todas las rutas de la API están **protegidas** por defecto. Requieren un token JWT válido.
2. **Excepciones Públicas**: Las rutas que no requieren autenticación están marcadas con el decorador `@PublicAccess()` y se indican a continuación como **[PÚBLICO]**.
3. **Mecanismo de Envío de Tokens**: El token JWT se puede enviar de dos formas:
   * **Cookie**: En una cookie llamada `access-token` (requiere configurar `credentials: true` en Axios/Fetch).
   * **Header**: En el encabezado HTTP: `Authorization: Bearer <JWT_TOKEN>`.
4. **Control de Roles**: Aunque existen roles (`ADMIN` y `USER`), las rutas protegidas permiten el acceso a cualquier usuario con token válido, a menos que se restrinja en el futuro. Los administradores tienen acceso sin restricciones a todas las rutas.

---

## 📈 Estructura de Paginación Común (`PaginationDto`)

Muchas solicitudes `GET` que listan recursos aceptan parámetros de consulta (Query Params) para paginar y buscar.

```typescript
// Estructura de Query Params para listados
{
  page?: number;        // Número de página (Por defecto: 1)
  limit?: number;       // Elementos por página (Por defecto: 10)
  search?: string;      // Término de búsqueda general (alias de 'q')
  q?: string;           // Término de búsqueda general
  bookId?: string;      // Filtrar por ID de libro (ej. en reviews)
  minRating?: number;   // Filtrar por rating mínimo (1 a 5)
}
```

---

## 📖 Módulo de Libros (`/books`)

Controla el catálogo de libros, la descarga, estadísticas de visualizaciones y el flujo de extracción automática con Inteligencia Artificial.

### 1. Analizar PDF con IA
* **Ruta**: `POST /books/analyze`
* **Acceso**: Protegido (Requiere Token)
* **Formato**: `multipart/form-data`
* **Cuerpo (Body)**:
  * `file`: Archivo PDF (requerido).
* **Descripción**: Analiza el PDF utilizando Gemini 2.5 Flash. Si el PDF es digital/nativo, extrae el texto de las primeras páginas; si es escaneado, renderiza la primera página a imagen y realiza análisis visual.
* **Respuesta**: Retorna los metadatos sugeridos (no guarda en base de datos):
  ```json
  {
    "title": "Título del Libro",
    "isbn": 9781234567890,
    "author": "Nombre del Autor",
    "editorial": "Nombre de la Editorial",
    "publicationDate": 2024,
    "gender": "Ficción / Tecnología / etc.",
    "synopsis": "Breve resumen autogenerado..."
  }
  ```

### 2. Crear Libro
* **Ruta**: `POST /books`
* **Acceso**: Protegido
* **Formato**: `multipart/form-data`
* **Cuerpo (Body)**:
  * `file`: Archivo PDF del libro (requerido).
  * `title`: string (opcional)
  * `isbn`: número (opcional)
  * `author`: string (opcional) - *Puede ser el UUID del autor existente o el nombre del autor en texto plano*. Si es un nombre, el backend buscará coincidencia o creará un nuevo autor de forma automática.
  * `editorial`: string (opcional) - *Puede ser el UUID de la editorial existente o el nombre*. Se creará automáticamente si no existe.
  * `gender`: string (opcional) - *Puede ser el UUID del género o el nombre*. Se creará automáticamente si no existe.
  * `publicationDate`: número (opcional, año)
  * `synopsis`: string (opcional)
* **Descripción**: Sube el PDF a Cloudinary y registra el libro con sus relaciones en la base de datos.

### 3. Listar Libros
* **Ruta**: `GET /books`
* **Acceso**: **[PÚBLICO]**
* **Query Params**: `PaginationDto` (`page`, `limit`)
* **Respuesta**:
  ```json
  {
    "status": { "statusMsg": "ACCEPTED", "statusCode": 200, "error": null },
    "meta": { "page": 1, "limit": 10, "lastPage": 5, "total": 48 },
    "data": [
      {
        "id": "uuid-libro",
        "title": "Título",
        "isbn": 978...,
        "author": "Nombre del Autor",
        "editorial": "Nombre de Editorial",
        "gender": "Género",
        "publicationDate": 2024,
        "synopsis": "...",
        "file": "https://res.cloudinary.com/...",
        "views": 15,
        "downloads": 3,
        "averageRating": 4.5,
        "isActive": true
      }
    ]
  }
  ```

### 4. Buscar Libros
* **Ruta**: `GET /books/search`
* **Acceso**: **[PÚBLICO]**
* **Query Params**: `PaginationDto` (usa `search` o `q` para buscar coincidencias parciales por título, ISBN, autor, editorial, género o año).

### 5. Obtener Detalle de un Libro
* **Ruta**: `GET /books/:id`
* **Acceso**: **[PÚBLICO]**
* **Descripción**: Retorna la información de un libro específico y **aumenta automáticamente su contador de visualizaciones (`views`) en +1**.

### 6. Descargar Libro
* **Ruta**: `GET /books/:id/download`
* **Acceso**: **[PÚBLICO]**
* **Descripción**: Incrementa el contador de descargas (`downloads`) en +1 y redirige la respuesta HTTP al archivo en Cloudinary configurado como adjunto (fuerza la descarga en el navegador).

### 7. Estadísticas / Tops
* **GET `/books/top-viewed` [PÚBLICO]**: Libros más leídos/vistos. Acepta query `limit` (por defecto 5).
* **GET `/books/top-downloaded` [PÚBLICO]**: Libros más descargados. Acepta query `limit` (por defecto 5).
* **GET `/books/top-by-category` [PÚBLICO]**: Agrupa libros por género. Retorna un objeto cuyas llaves son los géneros y sus valores son arreglos de hasta 6 libros:
  ```json
  {
    "status": { "statusMsg": "ACCEPTED", "statusCode": 200, "error": null },
    "meta": { "totalCategories": 3 },
    "data": {
      "Tecnología": [ { "id": "...", "title": "..." } ],
      "Ficción": [ { "id": "...", "title": "..." } ]
    }
  }
  ```

### 8. Actualizar Libro
* **Ruta**: `PATCH /books/:id`
* **Acceso**: Protegido
* **Formato**: `multipart/form-data`
* **Cuerpo**: Campos parciales de `CreateBookDto` y opcionalmente un nuevo archivo `file` para reemplazar el PDF.

### 9. Eliminar Libro
* **Ruta**: `DELETE /books/:id`
* **Acceso**: Protegido
* **Descripción**: Realiza un borrado lógico (`isActive = false`).

### 10. Probar Extracción de Texto (Prueba)
* **Ruta**: `POST /books/test-parse`
* **Acceso**: Protegido
* **Cuerpo**: `file` (PDF)
* **Descripción**: Retorna únicamente el texto plano y estado (`isScanned`) del documento sin llamar a Gemini.

---

## 👤 Módulo de Autenticación (`/auth`)

Maneja el registro, inicio de sesión, verificación de sesión y recuperación de contraseña.

### 1. Registrar Usuario
* **Ruta**: `POST /auth/register`
* **Acceso**: **[PÚBLICO]**
* **Formato**: `multipart/form-data`
* **Cuerpo (Body)**:
  * `name`: string (requerido)
  * `email`: string (requerido, debe pertenecer a un dominio permitido)
  * `password`: string (requerido)
  * `profilePhoto`: Archivo de imagen (opcional)

### 2. Iniciar Sesión
* **Ruta**: `POST /auth/login`
* **Acceso**: **[PÚBLICO]**
* **Cuerpo (JSON)**: `{ "email": "...", "password": "..." }`
* **Respuesta**: Retorna los datos del usuario e implícitamente establece o devuelve el token.

### 3. Verificar Token / Estado de Sesión
* **Ruta**: `POST /auth/verify`
* **Acceso**: **[PÚBLICO]**
* **Descripción**: Extrae el token de las cookies (`access-token`) o de la cabecera `Authorization` para verificar que la sesión sigue activa. Retorna los datos del usuario autenticado.

### 4. Perfil de Usuario
* **Ruta**: `GET /auth/profile`
* **Acceso**: Protegido
* **Respuesta**: Retorna los datos del usuario actualmente autenticado (obtenido del payload JWT).

### 5. Cambiar Contraseña (Logueado)
* **Ruta**: `POST /auth/change-password`
* **Acceso**: Protegido
* **Cuerpo (JSON)**:
  ```json
  {
    "currentPassword": "password_actual",
    "newPassword": "nueva_contrasena_de_minimo_8_caracteres"
  }
  ```

### 6. Solicitar Recuperación de Contraseña
* **Ruta**: `POST /auth/forgot-password`
* **Acceso**: **[PÚBLICO]**
* **Cuerpo (JSON)**: `{ "email": "usuario@dominio.com" }`
* **Descripción**: Envía un correo electrónico con un enlace que contiene un token único para restablecer la contraseña.

### 7. Restablecer Contraseña
* **Ruta**: `POST /auth/reset-password`
* **Acceso**: **[PÚBLICO]**
* **Cuerpo (JSON)**:
  ```json
  {
    "token": "token_recibido_en_el_correo",
    "newPassword": "nueva_contrasena_de_minimo_8_caracteres"
  }
  ```

---

## 👥 Módulo de Usuarios (`/users`)

### 1. Registrar / Crear Usuario Administrador o General
* **POST `/users` [PÚBLICO]**: Equivalente al registro público. Acepta `profilePhoto` en `multipart/form-data`.
* **GET `/users` [Protegido]**: Listado de todos los usuarios (Paginado).
* **GET `/users/search` [Protegido]**: Búsqueda avanzada de usuarios.
* **GET `/users/:id` [Protegido]**: Detalle de un usuario específico.
* **PATCH `/users/:id` [Protegido]**: Actualizar datos del usuario (nombre, email, o cambiar el `role` a `ADMIN` o `USER`).
* **DELETE `/users/:id` [Protegido]**: Desactivar cuenta.
* **POST `/users/:id/photo` [Protegido]**: Actualizar foto de perfil individualmente. Espera `multipart/form-data` con campo `file`.

---

## ✍️ Módulo de Autores (`/authors`)

Catálogo de escritores de los libros.

### 1. Listados y Búsquedas
* **GET `/authors` [PÚBLICO]**: Lista paginada de autores.
* **GET `/authors/search` [PÚBLICO]**: Buscar autores por nombre (query `search`).
* **GET `/authors/top` [PÚBLICO]**: Autores más leídos / populares. Acepta query `limit`.
* **GET `/authors/:id` [PÚBLICO]**: Detalle de un autor.
* **GET `/authors/:id/books` [PÚBLICO]**: Listado de todos los libros pertenecientes al autor.

### 2. Creación y Modificación
* **POST `/authors` [Protegido]**: Crear un autor. Formato `multipart/form-data` con campo `photo` (opcional) y campos del DTO (`authorName`, `biography`).
* **PATCH `/authors/:id` [Protegido]**: Actualización básica de campos de texto.
* **PATCH `/authors/update/:id` [Protegido]**: Actualización modificada que soporta cargar un archivo de foto nuevo (`multipart/form-data` con el archivo en el campo `photo`).
* **POST `/authors/:id/photo` [Protegido]**: Carga / actualiza individualmente la foto. Espera archivo en campo `file`.
* **DELETE `/authors/:id` [Protegido]**: Eliminar autor de forma lógica.

---

## 🏢 Módulo de Editoriales (`/editorials`)

* **POST `/editorials` [Protegido]**: Crear editorial. Cuerpo JSON: `{ "editorialName": "...", "address": "...", "phone": "..." }`.
* **GET `/editorials` [Protegido]**: Listado paginado.
* **GET `/editorials/search` [Protegido]**: Búsqueda/listado de editoriales.
* **GET `/editorials/:id` [Protegido]**: Detalle de editorial.
* **PATCH `/editorials/:id` [Protegido]**: Modificar datos.
* **DELETE `/editorials/:id` [Protegido]**: Eliminar editorial.

---

## 🏷️ Módulo de Géneros / Categorías (`/genders`)

Categorización de los libros.

* **POST `/genders` [Protegido]**: Crear categoría. Cuerpo JSON: `{ "genderName": "...", "description": "..." }`.
* **GET `/genders` [PÚBLICO]**: Listar géneros (Paginado).
* **GET `/genders/names` [PÚBLICO]**: Retorna **únicamente** un arreglo plano con los nombres de todos los géneros (muy útil para selects/filtros de búsqueda en la UI).
* **GET `/genders/search` [Protegido]**: Listar para panel administrativo.
* **GET `/genders/:id` [Protegido]**: Detalle de un género.
* **PATCH `/genders/:id` [Protegido]**: Actualizar.
* **DELETE `/genders/:id` [Protegido]**: Eliminar.

---

## ⭐ Módulo de Reseñas / Calificaciones (`/reviews`)

Calificaciones de libros dadas por usuarios (rango del 1 al 5).

### 1. Crear Reseña
* **Ruta**: `POST /reviews`
* **Acceso**: Protegido
* **Cuerpo (JSON)**:
  ```json
  {
    "userId": "uuid-del-usuario",
    "bookId": "uuid-del-libro",
    "rating": 5, // Entero del 1 al 5
    "comment": "¡Excelente libro, muy recomendado!" // Opcional
  }
  ```
* **Descripción**: Registra la reseña y **recalcula automáticamente la calificación promedio (`averageRating`) del libro**.

### 2. Filtrar Reseñas
* **Ruta**: `GET /reviews/filter`
* **Acceso**: Protegido
* **Query Params**:
  * `userId`: Filtrar reseñas hechas por un usuario.
  * `bookId`: Filtrar reseñas que pertenecen a un libro.
  * `limit` (opcional, defecto: 10)
  * `offset` (opcional, defecto: 1)

### 3. CRUD General
* **GET `/reviews` [Protegido]**: Lista general.
* **GET `/reviews/search` [Protegido]**: Búsqueda/Administración.
* **GET `/reviews/:id` [Protegido]**: Obtener reseña individual.
* **PATCH `/reviews/:id` [Protegido]**: Modificar calificación o comentario.
* **DELETE `/reviews/:id` [Protegido]**: Eliminar reseña.

---

## ❤️ Módulo de Favoritos (`/favorites`)

Permite a los usuarios marcar libros como favoritos.

### 1. Añadir a Favoritos
* **Ruta**: `POST /favorites`
* **Acceso**: Protegido
* **Cuerpo (JSON)**: `{ "bookId": "uuid-del-libro" }`
* **Descripción**: Asocia el libro a la lista de favoritos del usuario autenticado (el ID de usuario se extrae automáticamente del JWT).

### 2. Obtener Favoritos del Usuario
* **Ruta**: `GET /favorites`
* **Acceso**: Protegido
* **Descripción**: Retorna la lista paginada de libros favoritos del usuario actual.

### 3. Obtener Autores de los Favoritos
* **Ruta**: `GET /favorites/Authors`
* **Acceso**: Protegido
* **Descripción**: Retorna la lista de autores de los libros que el usuario actual ha guardado en favoritos.

### 4. Eliminar de Favoritos
* **Ruta**: `DELETE /favorites/:id`
* **Acceso**: Protegido
* **Descripción**: Elimina el registro de favorito por su ID.

---

## ☁️ Módulo de Cloudinary (`/cloudinary`)

Para subida directa de archivos ajenos al flujo estructurado de libros o usuarios.

* **POST `/cloudinary/upload` [Protegido]**: Subir un archivo genérico (`multipart/form-data` con campo `file`). Retorna la URL segura y metadatos de Cloudinary.
* **POST `/cloudinary/uploadProfilePhoto` [Protegido]**: Subir foto de perfil genérica (`multipart/form-data` con campo `profilePhoto`).
