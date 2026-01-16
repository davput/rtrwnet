# Payment Method Logos Guide

## Current Implementation

Saat ini menggunakan emoji sebagai placeholder untuk logo bank/payment method.

## Cara Menambahkan Logo Asli

### 1. Siapkan Logo

Download atau buat logo untuk setiap payment method:
- BCA (biru)
- BNI (oranye)
- BRI (biru)
- Permata (hijau)
- Mandiri (kuning/biru)
- GoPay (hijau)
- ShopeePay (oranye)
- QRIS (ungu/biru)

Format yang disarankan:
- SVG (vector, scalable)
- PNG (transparent background, 128x128px atau lebih)

### 2. Simpan Logo

Simpan logo di folder:
```
Frontend/UserDashboard/public/images/payment-methods/
```

Nama file:
- `bca.svg` atau `bca.png`
- `bni.svg` atau `bni.png`
- `bri.svg` atau `bri.png`
- `permata.svg` atau `permata.png`
- `mandiri.svg` atau `mandiri.png`
- `gopay.svg` atau `gopay.png`
- `shopeepay.svg` atau `shopeepay.png`
- `qris.svg` atau `qris.png`

### 3. Update PaymentPage.tsx

Ganti fungsi `getPaymentMethodIcon` dengan:

```typescript
const getPaymentMethodIcon = (method: PaymentMethod) => {
  const bankLogos: Record<string, { src: string; alt: string; color: string }> = {
    'bca_va': { 
      src: '/images/payment-methods/bca.svg', 
      alt: 'BCA',
      color: 'bg-blue-50' 
    },
    'bni_va': { 
      src: '/images/payment-methods/bni.svg', 
      alt: 'BNI',
      color: 'bg-orange-50' 
    },
    'bri_va': { 
      src: '/images/payment-methods/bri.svg', 
      alt: 'BRI',
      color: 'bg-blue-100' 
    },
    'permata_va': { 
      src: '/images/payment-methods/permata.svg', 
      alt: 'Permata',
      color: 'bg-green-50' 
    },
    'mandiri_bill': { 
      src: '/images/payment-methods/mandiri.svg', 
      alt: 'Mandiri',
      color: 'bg-yellow-50' 
    },
    'gopay': { 
      src: '/images/payment-methods/gopay.svg', 
      alt: 'GoPay',
      color: 'bg-green-100' 
    },
    'shopeepay': { 
      src: '/images/payment-methods/shopeepay.svg', 
      alt: 'ShopeePay',
      color: 'bg-orange-100' 
    },
    'qris': { 
      src: '/images/payment-methods/qris.svg', 
      alt: 'QRIS',
      color: 'bg-purple-50' 
    },
  };
  
  return bankLogos[method.id] || { 
    src: '/images/payment-methods/default.svg', 
    alt: 'Payment',
    color: 'bg-gray-50' 
  };
};
```

### 4. Update JSX untuk Menampilkan Image

Ganti bagian logo di JSX:

```tsx
{/* Bank/Payment Logo */}
<div className={`flex items-center justify-center w-12 h-12 rounded-lg border ${logo.color} p-2`}>
  <img 
    src={logo.src} 
    alt={logo.alt}
    className="w-full h-full object-contain"
  />
</div>
```

## Alternatif: Menggunakan React Icons

Jika tidak ada logo asli, bisa gunakan React Icons:

```bash
npm install react-icons
```

```typescript
import { 
  SiGopay, 
  SiShopee 
} from 'react-icons/si';
import { 
  FaUniversity, 
  FaQrcode 
} from 'react-icons/fa';

const getPaymentMethodIcon = (method: PaymentMethod) => {
  const icons: Record<string, React.ReactNode> = {
    'bca_va': <FaUniversity className="text-blue-600" />,
    'bni_va': <FaUniversity className="text-orange-600" />,
    'bri_va': <FaUniversity className="text-blue-700" />,
    'permata_va': <FaUniversity className="text-green-600" />,
    'mandiri_bill': <FaUniversity className="text-yellow-600" />,
    'gopay': <SiGopay className="text-green-600" />,
    'shopeepay': <SiShopee className="text-orange-600" />,
    'qris': <FaQrcode className="text-purple-600" />,
  };
  
  return icons[method.id] || <FaUniversity />;
};
```

## Sumber Logo

### Free Logo Resources:
1. **Brandfetch** - https://brandfetch.com/
2. **Worldvectorlogo** - https://worldvectorlogo.com/
3. **Seeklogo** - https://seeklogo.com/

### Official Sources:
- BCA: https://www.bca.co.id/
- BNI: https://www.bni.co.id/
- BRI: https://www.bri.co.id/
- Mandiri: https://www.bankmandiri.co.id/
- Permata: https://www.permatabank.com/
- GoPay: https://www.gojek.com/gopay/
- ShopeePay: https://shopee.co.id/
- QRIS: https://qris.id/

## Notes

- Pastikan logo memiliki lisensi yang sesuai untuk penggunaan komersial
- Gunakan format SVG untuk kualitas terbaik
- Optimalkan ukuran file untuk performa
- Gunakan lazy loading jika banyak logo
- Tambahkan fallback jika logo gagal load

## Current Color Scheme

| Bank | Color | Tailwind Class |
|------|-------|----------------|
| BCA | Blue | bg-blue-50 |
| BNI | Orange | bg-orange-50 |
| BRI | Blue | bg-blue-100 |
| Permata | Green | bg-green-50 |
| Mandiri | Yellow | bg-yellow-50 |
| GoPay | Green | bg-green-100 |
| ShopeePay | Orange | bg-orange-100 |
| QRIS | Purple | bg-purple-50 |
