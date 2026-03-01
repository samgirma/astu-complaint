import api from '../utils/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role?: 'STUDENT' | 'DEPARTMENT_STAFF' | 'ADMIN';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'STUDENT' | 'DEPARTMENT_STAFF' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

class AuthService {
  static async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data.data;
  }

  static async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  }

  static async getProfile(): Promise<any> {
    const response = await api.get('/auth/profile');
    return response.data.data.user;
  }

  static async updateProfile(data: { fullName?: string }): Promise<any> {
    const response = await api.put('/auth/profile', data);
    return response.data.data.user;
  }

  static async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put('/auth/change-password', data);
  }

  static async refreshToken(): Promise<{ token: string }> {
    const response = await api.post('/auth/refresh-token');
    return response.data.data;
  }
}

export default AuthService;
