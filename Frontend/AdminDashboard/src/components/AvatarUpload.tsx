import { useState, useRef } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as uploadApi from "@/api/upload.api";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  onAvatarChange?: (url: string | null) => void;
}

export function AvatarUpload({ currentAvatarUrl, userName, onAvatarChange }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadApi.uploadAvatar(file),
    onSuccess: (response) => {
      const avatarUrl = response.data.data.avatar_url;
      setPreviewUrl(null);
      onAvatarChange?.(avatarUrl);
      queryClient.invalidateQueries({ queryKey: ["admin", "profile"] });
      toast.success("Foto profil berhasil diupload");
    },
    onError: (error: any) => {
      setPreviewUrl(null);
      toast.error(error?.response?.data?.message || "Gagal mengupload foto");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => uploadApi.deleteAvatar(),
    onSuccess: () => {
      onAvatarChange?.(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "profile"] });
      toast.success("Foto profil berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Gagal menghapus foto");
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadMutation.mutate(file);
  };

  const handleDeleteAvatar = () => {
    deleteMutation.mutate();
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayUrl || undefined} alt={userName} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isLoading}
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {currentAvatarUrl ? "Ganti Foto" : "Upload Foto"}
        </Button>
        {currentAvatarUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAvatar}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Format: JPEG, PNG, GIF, WebP. Maks 5MB
      </p>
    </div>
  );
}
