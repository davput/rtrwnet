
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md px-4">
        <h1 className="text-6xl font-bold text-rtwnet-600">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800">Halaman Tidak Ditemukan</h2>
        <p className="text-muted-foreground">
          Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
        </p>
        <Button asChild className="mt-4 bg-rtwnet-600 hover:bg-rtwnet-700">
          <Link to="/">Kembali ke Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
