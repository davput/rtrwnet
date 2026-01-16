import type { Customer } from "@/features/customers/customer.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, User, Wifi, Server, Globe } from "lucide-react";

interface ProfileTabProps {
  customer: Customer;
  onDataChange?: () => void;
}

export function CustomerProfileTab({ customer, onDataChange }: ProfileTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400";
      case "pending_activation":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "suspended":
        return "Suspended";
      case "pending_activation":
        return "Pending Aktivasi";
      case "inactive":
        return "Tidak Aktif";
      case "terminated":
        return "Terminated";
      default:
        return status;
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case "dhcp":
        return "DHCP (Otomatis)";
      case "pppoe":
        return "PPPoE";
      case "static":
        return "Static IP";
      default:
        return type;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Informasi Pelanggan */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pelanggan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-rtwnet-500 to-rtwnet-600 flex items-center justify-center text-white text-2xl font-bold">
              {customer.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{customer.name || "-"}</h3>
              <p className="text-sm text-muted-foreground">{customer.customer_code || "-"}</p>
              <Badge variant="outline" className={`mt-2 ${getStatusColor(customer.status)}`}>
                {getStatusLabel(customer.status)}
              </Badge>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Telepon</p>
                <p className="text-sm text-muted-foreground">{customer.phone || "-"}</p>
              </div>
            </div>

            {customer.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t space-y-2">
            {customer.created_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Terdaftar</span>
                <span className="font-medium">
                  {new Date(customer.created_at).toLocaleDateString("id-ID")}
                </span>
              </div>
            )}
            {customer.installation_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Instalasi</span>
                <span className="font-medium">
                  {new Date(customer.installation_date).toLocaleDateString("id-ID")}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alamat Pemasangan */}
      <Card>
        <CardHeader>
          <CardTitle>Alamat Pemasangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{customer.address || "Alamat belum diisi"}</p>
            </div>
          </div>

          {customer.latitude && customer.longitude && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`,
                  "_blank"
                )
              }
            >
              <MapPin className="mr-2 h-4 w-4" />
              Lihat di Maps
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Paket Layanan */}
      <Card>
        <CardHeader>
          <CardTitle>Paket Layanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customer.service_plan ? (
            <>
              <div className="p-4 bg-gradient-to-br from-rtwnet-50 to-rtwnet-100 dark:from-rtwnet-900/20 dark:to-rtwnet-800/20 rounded-lg">
                <h4 className="font-semibold text-lg">{customer.service_plan.name}</h4>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Download</p>
                    <p className="text-xl font-bold text-rtwnet-600 dark:text-rtwnet-400">
                      {customer.service_plan.speed_download} Mbps
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Upload</p>
                    <p className="text-xl font-bold text-rtwnet-600 dark:text-rtwnet-400">
                      {customer.service_plan.speed_upload} Mbps
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">Biaya Bulanan</span>
                <span className="text-lg font-bold">
                  Rp {(customer.monthly_fee || 0).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Jatuh Tempo</span>
                <span className="text-sm font-medium">Tanggal {customer.due_date || 15}</span>
              </div>

              <Button variant="outline" className="w-full">
                Ubah Paket
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Paket belum dipilih</p>
          )}
        </CardContent>
      </Card>

      {/* Konfigurasi Jaringan */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Jaringan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tipe Layanan</span>
            <Badge variant="outline">{getServiceTypeLabel(customer.service_type)}</Badge>
          </div>

          {customer.service_type === "pppoe" && (
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">PPPoE Username</p>
                  <p className="text-sm font-mono font-medium">{customer.pppoe_username || "-"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">PPPoE Password</p>
                  <p className="text-sm font-mono font-medium">
                    {customer.pppoe_password ? "••••••••" : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {customer.service_type === "static" && (
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="text-sm font-mono font-medium">{customer.static_ip || "-"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Gateway</p>
                  <p className="text-sm font-mono font-medium">{customer.static_gateway || "-"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">DNS</p>
                  <p className="text-sm font-mono font-medium">{customer.static_dns || "-"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Online */}
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status Koneksi</span>
              <Badge variant={customer.is_online ? "default" : "secondary"}>
                {customer.is_online ? "Online" : "Offline"}
              </Badge>
            </div>
            {customer.ip_address && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">IP Address</span>
                <span className="text-sm font-mono">{customer.ip_address}</span>
              </div>
            )}
            {customer.last_seen && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Terakhir Online</span>
                <span className="text-sm">
                  {new Date(customer.last_seen).toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
