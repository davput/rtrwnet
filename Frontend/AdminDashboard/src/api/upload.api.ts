import api from "./axios";
import type { ApiResponse } from "@/types";

export interface UploadResponse {
  avatar_url: string;
}

// Upload admin avatar
export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  
  return api.post<ApiResponse<UploadResponse>>("/admin/upload/avatar", formData);
};

// Delete admin avatar
export const deleteAvatar = () => {
  return api.delete<ApiResponse<null>>("/admin/upload/avatar");
};
