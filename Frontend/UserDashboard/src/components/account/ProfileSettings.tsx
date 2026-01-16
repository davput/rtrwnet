import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/auth.store';
import { useUpdateProfile } from '@/hooks/useSettings';
import { Loader2 } from 'lucide-react';
import { AvatarUpload } from './AvatarUpload';

export function ProfileSettings() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatar_url || user.avatar || null);
    }
  }, [user]);

  const handleAvatarChange = (url: string | null) => {
    setAvatarUrl(url);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ name, email, phone });
      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui profil');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Profil</CardTitle>
        <CardDescription>Perbarui informasi profil dan pengaturan akun Anda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center justify-center pb-6 border-b">
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            userName={user?.name || 'User'}
            onAvatarChange={handleAvatarChange}
          />
        </div>

        {/* Form Section - Limited width for better readability */}
        <div className="max-w-xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Nama Lengkap
            </Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/50 border-border/60 focus:bg-background transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted/50 border-border/60 focus:bg-background transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Nomor Telepon
            </Label>
            <Input 
              id="phone" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="bg-muted/50 border-border/60 focus:bg-background transition-colors"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6">
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
