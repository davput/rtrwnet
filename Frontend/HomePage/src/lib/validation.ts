export const validateSubdomain = (subdomain: string): string | null => {
  if (subdomain.length < 3 || subdomain.length > 20) {
    return "Subdomain harus 3-20 karakter";
  }
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return "Subdomain hanya boleh huruf kecil, angka, dan tanda hubung";
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email tidak valid";
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!/^08\d{8,11}$/.test(phone)) {
    return "Nomor telepon harus diawali 08 dan 10-13 digit";
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return "Password minimal 8 karakter";
  }
  return null;
};

export const sanitizeSubdomain = (subdomain: string): string => {
  return subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 20);
};

export const formatPrice = (price: number): string => {
  return price.toLocaleString("id-ID");
};
