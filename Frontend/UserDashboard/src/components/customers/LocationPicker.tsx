import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string) => void;
}

function MapUpdater({ center, shouldCenter }: { center: [number, number]; shouldCenter: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (shouldCenter) {
      map.setView(center, map.getZoom());
    }
  }, [center, shouldCenter, map]);
  
  return null;
}

function LocationMarker({ position, onPositionChange }: { 
  position: [number, number]; 
  onPositionChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>
        Lokasi Customer<br />
        Lat: {position[0].toFixed(6)}<br />
        Lng: {position[1].toFixed(6)}
      </Popup>
    </Marker>
  ) : null;
}

export function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([-6.2615, 107.1534]); // Default: Bekasi
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [shouldCenterMap, setShouldCenterMap] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition([lat, lng]);
        setShouldCenterMap(true);
      }
    }
  }, [latitude, longitude]);

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat.toFixed(6), lng.toFixed(6));
    setShouldCenterMap(false); // Don't center when user clicks on map
  };

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setPosition([lat, lng]);
          onLocationChange(lat.toFixed(6), lng.toFixed(6));
          setShouldCenterMap(true); // Center when using "Get Current Location"
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.");
        }
      );
    } else {
      alert("Geolocation tidak didukung oleh browser Anda.");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Using Nominatim (OpenStreetMap) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition([lat, lng]);
        onLocationChange(lat.toFixed(6), lng.toFixed(6));
        setShouldCenterMap(true); // Center when searching
      } else {
        alert("Lokasi tidak ditemukan. Coba dengan alamat yang lebih spesifik.");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Gagal mencari lokasi. Silakan coba lagi.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <CardTitle>Pilih Lokasi di Map</CardTitle>
        </div>
        <CardDescription>
          Click pada map untuk menandai lokasi customer, atau gunakan tombol di bawah
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Cari alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSearch}
              disabled={isSearching}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
          >
            <Navigation className="mr-2 h-4 w-4" />
            Lokasi Saya
          </Button>
        </div>

        {/* Coordinates Display */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
          <div>
            <Label className="text-xs text-muted-foreground">Latitude</Label>
            <p className="font-mono font-medium">{position[0].toFixed(6)}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Longitude</Label>
            <p className="font-mono font-medium">{position[1].toFixed(6)}</p>
          </div>
        </div>

        {/* Map */}
        <div className="h-[400px] rounded-lg overflow-hidden border">
          <MapContainer
            center={position}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={position} shouldCenter={shouldCenterMap} />
            <LocationMarker
              position={position}
              onPositionChange={handlePositionChange}
            />
          </MapContainer>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 Tips: Click pada map untuk menandai lokasi, atau gunakan tombol "Lokasi Saya" untuk menggunakan GPS Anda.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
