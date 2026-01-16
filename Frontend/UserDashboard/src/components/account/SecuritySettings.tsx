import { useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { useChangePassword } from '@/hooks/useSettings';

export function SecuritySettings() {
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter');
      return;
    }

    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success('Kata sandi berhasil diperbarui');
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui kata sandi');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ubah Kata Sandi</CardTitle>
          <CardDescription>
            Perbarui kata sandi akun Anda. Pastikan kata sandi baru Anda kuat dan tidak mudah
            ditebak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Kata Sandi Saat Ini</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-password">Kata Sandi Baru</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleChangePassword}
            disabled={changePassword.isPending || !currentPassword || !newPassword}
          >
            {changePassword.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memperbarui...
              </>
            ) : (
              'Perbarui Kata Sandi'
            )}
          </Button>
        </CardFooter>
      </Card>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Keamanan Akun</AlertTitle>
        <AlertDescription>
          Untuk keamanan yang lebih baik, gunakan kata sandi yang kuat dengan kombinasi huruf
          besar, huruf kecil, angka, dan simbol.
        </AlertDescription>
      </Alert>
    </div>
  );
}
