import { api } from './axios';

export interface UploadResponse {
  avatar_url: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Upload user avatar
export const uploadAvatar = async (file: File): Promise<ApiResponse<UploadResponse>> => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return api.post('/upload/avatar', formData);
};

// Delete user avatar
export const deleteAvatar = async (): Promise<ApiResponse<null>> => {
  return api.delete('/upload/avatar');
};
