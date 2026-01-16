import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOLTs, useODCs, useODPs } from '@/hooks/useInfrastructure';
import {
  Server,
  Box,
  MapPin,
  ZoomIn,
  ZoomOut,
  Layers,
} from 'lucide-react';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for different node types
const createIcon = (color: string, borderColor: string, size: number = 24) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid ${borderColor};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      ">
        <div style="
          width: ${size * 0.4}px;
          height: ${size * 0.4}px;
          background: white;
          border-radius: 50%;
          opacity: 0.8;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Pre-defined icons
const oltIcon = createIcon('#ef4444', '#b91c1c', 28);
const odcIcon = createIcon('#f59e0b', '#d97706', 24);
const odpIcon = createIcon('#22c55e', '#16a34a', 20);

// Map controls component
function MapControls() {
  const map = useMap();

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        variant="secondary"
        size="icon"
        className="bg-white shadow-md"
        onClick={() => map.zoomIn()}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="bg-white shadow-md"
        onClick={() => map.zoomOut()}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Fit bounds component
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
}

export function NetworkMap() {
  const [selectedOLT, setSelectedOLT] = useState<string>('all');
  const [showOLT, setShowOLT] = useState(true);
  const [showODC, setShowODC] = useState(true);
  const [showODP, setShowODP] = useState(true);

  const { data: oltsData, isLoading: loadingOLTs } = useOLTs();
  const { data: odcsData, isLoading: loadingODCs } = useODCs();
  const { data: odpsData, isLoading: loadingODPs } = useODPs();

  const olts = oltsData?.data || [];
  const odcs = odcsData?.data || [];
  const odps = odpsData?.data || [];

  const isLoading = loadingOLTs || loadingODCs || loadingODPs;

  // Filter ODCs based on selected OLT
  const filteredODCs = useMemo(() => {
    if (selectedOLT === 'all') return odcs;
    return odcs.filter((odc) => odc.olt_id === selectedOLT);
  }, [odcs, selectedOLT]);

  // Filter ODPs based on filtered ODCs
  const filteredODPs = useMemo(() => {
    if (selectedOLT === 'all') return odps;
    const odcIds = filteredODCs.map((odc) => odc.id);
    return odps.filter((odp) => odcIds.includes(odp.odc_id));
  }, [odps, filteredODCs, selectedOLT]);

  // Calculate map bounds
  const bounds = useMemo(() => {
    const points: [number, number][] = [];

    if (showOLT) {
      // OLTs don't have lat/lng in current schema, skip for now
    }

    if (showODC) {
      filteredODCs.forEach((odc) => {
        if (odc.latitude && odc.longitude) {
          points.push([odc.latitude, odc.longitude]);
        }
      });
    }

    if (showODP) {
      filteredODPs.forEach((odp) => {
        if (odp.latitude && odp.longitude) {
          points.push([odp.latitude, odp.longitude]);
        }
      });
    }

    if (points.length === 0) {
      // Default to Indonesia center
      return null;
    }

    return L.latLngBounds(points);
  }, [filteredODCs, filteredODPs, showOLT, showODC, showODP]);

  // Generate connection lines between ODC and ODP
  const connectionLines = useMemo(() => {
    const lines: { from: [number, number]; to: [number, number]; color: string }[] = [];

    if (showODC && showODP) {
      filteredODPs.forEach((odp) => {
        if (odp.latitude && odp.longitude) {
          const parentODC = filteredODCs.find((odc) => odc.id === odp.odc_id);
          if (parentODC && parentODC.latitude && parentODC.longitude) {
            lines.push({
              from: [parentODC.latitude, parentODC.longitude],
              to: [odp.latitude, odp.longitude],
              color: '#94a3b8',
            });
          }
        }
      });
    }

    return lines;
  }, [filteredODCs, filteredODPs, showODC, showODP]);

  // Default center (Indonesia)
  const defaultCenter: [number, number] = [-6.2088, 106.8456];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peta Jaringan</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter OLT:</span>
              <Select value={selectedOLT} onValueChange={setSelectedOLT}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih OLT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua OLT</SelectItem>
                  {olts.map((olt) => (
                    <SelectItem key={olt.id} value={olt.id}>
                      {olt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tampilkan:</span>
              <Button
                variant={showOLT ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOLT(!showOLT)}
                className="gap-1"
              >
                <Server className="h-3 w-3" />
                OLT
              </Button>
              <Button
                variant={showODC ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowODC(!showODC)}
                className="gap-1"
              >
                <Box className="h-3 w-3" />
                ODC
              </Button>
              <Button
                variant={showODP ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowODP(!showODP)}
                className="gap-1"
              >
                <MapPin className="h-3 w-3" />
                ODP
              </Button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs">OLT</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs">ODC</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs">ODP</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Peta Jaringan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full relative rounded-b-lg overflow-hidden">
            <MapContainer
              center={defaultCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapControls />
              {bounds && <FitBounds bounds={bounds} />}

              {/* Connection lines */}
              {connectionLines.map((line, index) => (
                <Polyline
                  key={`line-${index}`}
                  positions={[line.from, line.to]}
                  color={line.color}
                  weight={2}
                  opacity={0.6}
                  dashArray="5, 5"
                />
              ))}

              {/* ODC Markers */}
              {showODC &&
                filteredODCs.map((odc) => {
                  if (!odc.latitude || !odc.longitude) return null;
                  return (
                    <Marker
                      key={`odc-${odc.id}`}
                      position={[odc.latitude, odc.longitude]}
                      icon={odcIcon}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <Box className="h-4 w-4 text-amber-500" />
                            <span className="font-semibold">ODC</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong>Nama:</strong> {odc.name}
                            </p>
                            <p>
                              <strong>Lokasi:</strong> {odc.location || '-'}
                            </p>
                            <p>
                              <strong>Port:</strong> {odc.used_ports}/{odc.total_ports}
                            </p>
                            <Badge
                              className={
                                odc.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {odc.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* ODP Markers */}
              {showODP &&
                filteredODPs.map((odp) => {
                  if (!odp.latitude || !odp.longitude) return null;
                  return (
                    <Marker
                      key={`odp-${odp.id}`}
                      position={[odp.latitude, odp.longitude]}
                      icon={odpIcon}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="font-semibold">ODP</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong>Nama:</strong> {odp.name}
                            </p>
                            <p>
                              <strong>Lokasi:</strong> {odp.location || '-'}
                            </p>
                            <p>
                              <strong>Port:</strong> {odp.used_ports}/{odp.total_ports}
                            </p>
                            <Badge
                              className={
                                odp.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {odp.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Server className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{olts.length}</p>
                <p className="text-sm text-muted-foreground">Total OLT</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Box className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredODCs.length}</p>
                <p className="text-sm text-muted-foreground">Total ODC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredODPs.length}</p>
                <p className="text-sm text-muted-foreground">Total ODP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
