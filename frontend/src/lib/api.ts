import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? 'http://eva.test-domain.ru'
    : 'http://localhost:3000', // Development fallback
});

// Add JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses - token expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('currentGirl');
      // Clear all chat messages
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chatMessages_')) {
          localStorage.removeItem(key);
        }
      });
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const chatAPI = {
  sendMessage: async (messages: { role: 'user' | 'assistant' | 'system', content: string }[]): Promise<{ response: string }> => {
    const response = await api.post('/chat/send', { messages });
    return response.data;
  },
  detectIntent: async (message: string): Promise<{ intent: 'text' | 'image' | 'video' }> => {
    const response = await api.post('/chat/detect-intent', { message });
    return response.data;
  },
  generateImage: async (prompt: string, baseImageUrl?: string): Promise<{ imageUrl: string }> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/chat/generate-image', { prompt, baseImageUrl }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },
  generateVideo: async (prompt: string, baseImageUrl?: string): Promise<{ videoUrl: string }> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/chat/generate-video', { prompt, baseImageUrl }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },
  generateVideoFromImage: async (imageUrl: string, text: string): Promise<{ videoUrl: string }> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/chat/generate-video-from-image', { imageUrl, text }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },
  createGirl: async (): Promise<{ name: string; appearance: string; personality: string; firstMessage: string; avatarUrl: string }> => {
    const response = await api.post('/chat/create-girl');
    return response.data;
  },
};

export const authAPI = {
  register: async (userData: { email: string; password: string; firstName: string }): Promise<{ access_token: string }> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (email: string, password: string): Promise<{ access_token: string }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getProfile: async (): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await api.get('/auth/profile', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },
};

export const usersAPI = {
  getProfile: async (): Promise<any> => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  updateProfile: async (profileData: { firstName?: string }): Promise<any> => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },
  getBalance: async (): Promise<{ balance: number; transactions: any[] }> => {
    const response = await api.get('/users/balance');
    return response.data;
  },
  createGirl: async (girlData: { name: string; appearance: string; personality: string; avatarUrl?: string }): Promise<any> => {
    const response = await api.post('/users/girls', girlData);
    return response.data;
  },
  getGirls: async (): Promise<any[]> => {
    const response = await api.get('/users/girls');
    return response.data;
  },
  updateGirl: async (girlId: string, updateData: { appearance?: string; personality?: string; avatarUrl?: string }): Promise<any> => {
    const response = await api.put(`/users/girls/${girlId}`, updateData);
    return response.data;
  },
  deleteGirl: async (girlId: string): Promise<void> => {
    await api.delete(`/users/girls/${girlId}`);
  },
  getConversations: async (girlId: string): Promise<any[]> => {
    const response = await api.get(`/users/conversations/${girlId}`);
    return response.data;
  },
};

export default api;
