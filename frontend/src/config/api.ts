// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  cases: '/api/cases',
  games: '/api/games',
  chat: '/api/games', // Chat is nested under games: /api/games/:game_id/chat
  evidence: '/api/evidence',
  accusation: '/api/accusation',
  messages: '/api/messages',
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
