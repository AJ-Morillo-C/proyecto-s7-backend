CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMERACIONES
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'user_role_enum'
    ) THEN
        CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'USER');
    END IF;
END
$$;


-- =====================================================
-- TABLA DE AUTORES
-- =====================================================

CREATE TABLE IF NOT EXISTS author (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    author_name VARCHAR NOT NULL,
    biography TEXT NOT NULL,
    photo VARCHAR
);


-- =====================================================
-- TABLA DE EDITORIALES
-- =====================================================

CREATE TABLE IF NOT EXISTS editorial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    editorial_name VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
    phone VARCHAR NOT NULL
);


-- =====================================================
-- TABLA DE GÉNEROS
-- =====================================================

CREATE TABLE IF NOT EXISTS gender (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    gender_name VARCHAR NOT NULL,
    description TEXT
);


-- =====================================================
-- TABLA DE USUARIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'USER',

    reset_token VARCHAR,
    reset_token_expiry TIMESTAMP,
    reset_password_attempts INTEGER NOT NULL DEFAULT 0,
    last_reset_password_attempt TIMESTAMP,

    profile_photo VARCHAR
);


-- =====================================================
-- TABLA DE LIBROS
-- =====================================================

CREATE TABLE IF NOT EXISTS book (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    title VARCHAR NOT NULL,
    isbn VARCHAR UNIQUE,

    author UUID REFERENCES author(id),
    editorial UUID REFERENCES editorial(id),
    publication_date NUMERIC,
    gender UUID REFERENCES gender(id),

    synopsis TEXT,
    file VARCHAR NOT NULL,

    views NUMERIC NOT NULL DEFAULT 0,
    downloads NUMERIC NOT NULL DEFAULT 0,
    average_rating NUMERIC(3,2) NOT NULL DEFAULT 0
);


-- =====================================================
-- TABLA DE RESEÑAS
-- =====================================================

CREATE TABLE IF NOT EXISTS review (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    user_id UUID NOT NULL REFERENCES "user"(id),
    book_id UUID NOT NULL REFERENCES book(id),

    rating INTEGER NOT NULL,
    comment TEXT,

    CONSTRAINT unique_user_book_review
        UNIQUE (user_id, book_id)
);


-- =====================================================
-- TABLA DE FAVORITOS
-- =====================================================

CREATE TABLE IF NOT EXISTS favorite (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    user_id UUID NOT NULL REFERENCES "user"(id),
    book_id UUID NOT NULL REFERENCES book(id),

    CONSTRAINT unique_user_book_favorite
        UNIQUE (user_id, book_id)
);


-- =====================================================
-- USUARIOS POR DEFECTO
-- =====================================================

INSERT INTO "user" (name, email, password, role)
VALUES
    (
        'Administrador UniBooks',
        'admin@unibooks.local',
        '$2b$12$iIxe5W3myJ4bQV0kyz6H3u9xhq2SEDtD4Hmmk7o8vC9CY2caSTSsK',
        'ADMIN'
    ),
    (
        'Usuario UniBooks',
        'usuario@unibooks.local',
        '$2b$12$MfSGwJhpqVt3j9VP1v3TPOSklhc9y/a/K9JOgWhUTl60KOEPF/o8y',
        'USER'
    )
ON CONFLICT (email) DO NOTHING;
