CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database tables based on the entity model

-- Tabla de autores
CREATE TABLE IF NOT EXISTS author (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    author_name VARCHAR NOT NULL,
    biography TEXT,
    photo VARCHAR
);

-- Tabla de editoriales
CREATE TABLE IF NOT EXISTS editorial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    editorial_name VARCHAR NOT NULL,
    address VARCHAR,
    phone VARCHAR
);

-- Tabla de géneros
CREATE TABLE IF NOT EXISTS gender (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    gender_name VARCHAR NOT NULL,
    description TEXT
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'USER',
    reset_token VARCHAR,
    reset_token_expiry TIMESTAMP,
    reset_password_attempts INTEGER DEFAULT 0,
    last_reset_password_attempt TIMESTAMP,
    profile_photo VARCHAR
);

-- Tabla de libros
CREATE TABLE IF NOT EXISTS book (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    title VARCHAR NOT NULL,
    isbn VARCHAR UNIQUE,
    author UUID REFERENCES author(id),
    editorial UUID REFERENCES editorial(id),
    publication_date NUMERIC,
    gender UUID REFERENCES gender(id),
    synopsis TEXT,
    file VARCHAR NOT NULL,
    views NUMERIC DEFAULT 0,
    downloads NUMERIC DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0
);

-- Tabla de reseñas
CREATE TABLE IF NOT EXISTS review (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES "user"(id),
    book_id UUID REFERENCES book(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    CONSTRAINT unique_user_book_review UNIQUE (user_id, book_id)
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favorite (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES "user"(id),
    book_id UUID REFERENCES book(id),
    CONSTRAINT unique_user_book_favorite UNIQUE (user_id, book_id)
);

-- Datos iniciales
INSERT INTO author (author_name, biography) VALUES 
('Gabriel García Márquez', 'Colombian novelist, short-story writer, screenwriter, and journalist, known for his magical realism style.'),
('J.K. Rowling', 'British author, philanthropist, film producer, television producer, and screenwriter, best known for the Harry Potter series.'),
('Stephen King', 'American author of horror, supernatural fiction, suspense, crime, science-fiction, and fantasy novels.');

INSERT INTO editorial (editorial_name, address, phone) VALUES 
('Penguin Random House', '1745 Broadway, New York, NY 10019', '+1-212-782-9000'),
('HarperCollins', '195 Broadway, New York, NY 10007', '+1-212-207-7000'),
('Simon & Schuster', '1230 Avenue of the Americas, New York, NY 10020', '+1-212-698-7000');

INSERT INTO gender (gender_name, description) VALUES 
('Fiction', 'Literary works created from the imagination, not presented as fact, though they may be based on a true story or situation.'),
('Fantasy', 'A genre of speculative fiction set in a fictional universe, often inspired by real world myths and folklore.'),
('Horror', 'A genre of fiction which is intended to frighten, scare, or disgust.'),
('Science Fiction', 'A genre of speculative fiction that typically deals with imaginative and futuristic concepts.'),
('Romance', 'A genre that places its primary focus on the relationship and romantic love between two people.'),
('Mystery', 'A genre of fiction that usually involves a mysterious death or a crime to be solved.');

-- Usuario admin (la contraseña debe ser hasheada en producción)
INSERT INTO "user" (name, email, password, role) VALUES 
('Admin', 'admin@admin.com', '$2b$12$aE5OjesA6VQMiIipk.KnherK.CX.fKXMvgQ1el52MPWfCOiFcA1/O', 'ADMIN');

-- Libros de ejemplo
INSERT INTO book (title, isbn, author, editorial, gender, synopsis, file, views, downloads) VALUES
('One Hundred Years of Solitude', 9780060883287, (SELECT id FROM author WHERE author_name = 'Gabriel García Márquez'), 
 (SELECT id FROM editorial WHERE editorial_name = 'HarperCollins'), 
 (SELECT id FROM gender WHERE gender_name = 'Fiction'),
 'The multi-generational story of the Buendía family, whose patriarch, José Arcadio Buendía, founded the town of Macondo.',
 'https://example.com/books/one-hundred-years-of-solitude.pdf', 1250, 450),

('Harry Potter and the Philosopher''s Stone', 9780747532743, (SELECT id FROM author WHERE author_name = 'J.K. Rowling'), 
 (SELECT id FROM editorial WHERE editorial_name = 'Penguin Random House'), 
 (SELECT id FROM gender WHERE gender_name = 'Fantasy'),
 'The first novel in the Harry Potter series, it follows Harry Potter, a young wizard who discovers his magical heritage.',
 'https://example.com/books/harry-potter.pdf', 3500, 1200),

('The Shining', 9780385121675, (SELECT id FROM author WHERE author_name = 'Stephen King'), 
 (SELECT id FROM editorial WHERE editorial_name = 'Simon & Schuster'), 
 (SELECT id FROM gender WHERE gender_name = 'Horror'),
 'The story follows Jack Torrance, his wife Wendy, and their son Danny as they experience a haunted hotel called the Overlook.',
 'https://example.com/books/the-shining.pdf', 2100, 780);