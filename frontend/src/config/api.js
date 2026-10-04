// Centralized API configuration supporting local development and production
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const AI_MOCK_URL = import.meta.env.VITE_AI_MOCK_URL || "http://localhost:8000";
export const AI_CHAT_URL = import.meta.env.VITE_AI_CHAT_URL || "http://localhost:8000";

