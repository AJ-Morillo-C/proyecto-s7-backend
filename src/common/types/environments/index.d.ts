declare namespace NodeJS {
  export interface ProcessEnv {
    // App Config
    PORT: string;
    NODE_ENV: "development" | "production" | "test";
    APP_URL: string;

    // Database Config
    DB_HOST: string;
    DB_PORT: string;
    POSTGRES_DB: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    DB_SYNCHRONIZE?: string;
    DB_LOGGING?: string;

    // Security Config
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
    JWT_RESET_SECRET: string;
    JWT_RESET_EXPIRES_IN: string;
    COOKIE_SECRET: string;
    PASSWORD_SALT_ROUNDS: string;

    // Email Config
    MAIL_HOST: string;
    MAIL_PORT: string;
    MAIL_SECURE: string;
    MAIL_USER: string;
    MAIL_PASSWORD: string;
    MAIL_FROM_EMAIL: string;

    // Frontend Config
    FRONTEND_URL: string;
    RESET_PASSWORD_URL: string;

    // Cloudinary Config
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  }
}
