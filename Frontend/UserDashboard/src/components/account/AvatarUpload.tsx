import { useState, useRef } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import * as uploadApi from '@/api/upload.api';
import { authStore } from '@/features/auth/auth.store';
import { ImageCropper } from '@/components/ui/image-cropper';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  onAvatarChange?: (url: string | null) => void;
}

export function AvatarUpload({ currentAvatarUrl, userName, onAvatarChange }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadApi.uploadAvatar(file),
    onSuccess: (response) => {
      const avatarUrl = response?.data?.avatar_url || response?.avatar_url;
      
      if (avatarUrl) {
        setPreviewUrl(avatarUrl);
        onAvatarChange?.(avatarUrl);
        
        const currentUser = authStore.getUser();
        if (currentUser) {
          authStore.setUser({ ...currentUser, avatar_url: avatarUrl });
        }
      }
      
      toast.success('Foto profil berhasil diupload');
    },
    onError: (error: any) => {
      setPreviewUrl(null);
      toast.error(error?.message || 'Gagal mengupload foto');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => uploadApi.deleteAvatar(),
    onSuccess: () => {
      setPreviewUrl(null);
      onAvatarChange?.(null);
      
      const currentUser = authStore.getUser();
      if (currentUser) {
        authStore.setUser({ ...currentUser, avatar_url: undefined });
      }
      
      toast.success('Foto profil berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Gagal menghapus foto');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    event.target.value = '';

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP');
      return;
    }

    // Validate file size (10MB for original, will be compressed after crop)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB');
      return;
    }

    // Read file and open cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Create file from blob
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    
    // Show preview immediately
    const previewUrl = URL.createObjectURL(croppedBlob);
    setPreviewUrl(previewUrl);
    
    // Upload cropped image
    uploadMutation.mutate(file);
  };

  const handleDeleteAvatar = () => {
    deleteMutation.mutate();
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
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

      <div className="flex flex-col items-center gap-2">
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          <Camera className="h-4 w-4 mr-2" />
          {currentAvatarUrl || previewUrl ? 'Ganti Foto' : 'Upload Foto'}
        </Button>
        {(currentAvatarUrl || previewUrl) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteAvatar}
            disabled={isLoading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus Foto
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Format: JPEG, PNG, GIF, WebP. Maks 10MB
      </p>

      {/* Image Cropper Dialog */}
      {selectedImage && (
        <ImageCropper
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setSelectedImage(null);
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </div>
  );
}
