// Centralized API configuration supporting local development and live production on Render
const DEFAULT_PROD_URL = "https://kaushalai.onrender.com";
const DEFAULT_DEV_URL = "http://localhost:8000";

const BACKEND_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? DEFAULT_PROD_URL : DEFAULT_DEV_URL);

export const API_BASE_URL = BACKEND_BASE;
export const AI_MOCK_URL = import.meta.env.VITE_AI_MOCK_URL || BACKEND_BASE;
export const AI_CHAT_URL = import.meta.env.VITE_AI_CHAT_URL || BACKEND_BASE;
