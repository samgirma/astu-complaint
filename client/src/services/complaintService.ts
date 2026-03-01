import api from '../utils/api';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  _count: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface CreateComplaintData {
  title: string;
  description: string;
  category: string;
  image?: File;
}

export interface ComplaintStats {
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
  resolutionRate: number;
  mostCommonCategory: string;
  categoryBreakdown: Array<{
    category: string;
    _count: number;
  }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  complaints: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ComplaintService {
  // Create a new complaint
  static async createComplaint(data: CreateComplaintData): Promise<Complaint> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.complaint;
  }

  // Get all complaints with pagination and filtering
  static async getComplaints(params: PaginationParams = {}): Promise<PaginatedResponse<Complaint>> {
    const response = await api.get('/complaints', { params });
    return response.data.data;
  }

  // Get single complaint by ID
  static async getComplaintById(id: string): Promise<Complaint> {
    const response = await api.get(`/complaints/${id}`);
    return response.data.data.complaint;
  }

  // Update complaint status
  static async updateComplaintStatus(id: string, status: string, comment?: string): Promise<Complaint> {
    const response = await api.patch(`/complaints/${id}/status`, { status, comment });
    return response.data.data.complaint;
  }

  // Add comment to complaint
  static async addComment(complaintId: string, content: string): Promise<Comment> {
    const response = await api.post(`/complaints/${complaintId}/comments`, { content });
    return response.data.data.comment;
  }

  // Delete complaint
  static async deleteComplaint(id: string): Promise<void> {
    await api.delete(`/complaints/${id}`);
  }

  // Get complaint statistics
  static async getComplaintStats(): Promise<ComplaintStats> {
    const response = await api.get('/complaints/stats');
    return response.data.data;
  }

  // Upload image (separate method if needed)
  static async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.url;
  }
}

export default ComplaintService;
