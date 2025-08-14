
declare namespace NodeJS {
  interface ProcessEnv {
    DB_HOST?: string;
    DB_PORT?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
    DB_NAME?: string;
    APP_PORT?: string;
    ACCESS_TOKEN_SECRET?: string;
    REFRESH_TOKEN_SECRET?: string;
    ENCRYPTION_KEY?: string;
    GEMINI_API_KEY?: string;
    APP_URL?: string;
  }
}
