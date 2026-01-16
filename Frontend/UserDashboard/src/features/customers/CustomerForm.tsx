import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "./customer.api";
import type { CreateCustomerRequest } from "./customer.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardForm, WizardStep } from "@/components/shared";
import { ArrowLeft, User, MapPin, Wifi, CreditCard } from "lucide-react";
import { servicePlanApi } from "@/features/service-plans/service-plan.api";
import { settingsApi } from "@/api/settings.api";
import { paymentApi } from "@/features/payments/payment.api";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/customers/LocationPicker";
import type { TenantSettings } from "@/types/settings";
import { format } from "date-fns";

interface CustomerFormProps {
  customerId?: string;
  mode?: "create" | "edit";
}

export function CustomerForm({ mode = "create" }: CustomerFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    latitude: "",
    longitude: "",
    servicePlanId: "",
    serviceType: "dhcp",
    // PPPoE settings
    pppoeUsername: "",
    pppoePassword: "",
    // Static IP settings
    staticIp: "",
    staticGateway: "",
    staticDns: "",
    paymentMethod: "cash",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [servicePlans, setServicePlans] = useState<any[]>([]);
  const [billingSettings, setBillingSettings] = useState<TenantSettings | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansData, settings] = await Promise.all([
          servicePlanApi.getAll(),
          settingsApi.getTenantSettings(),
        ]);
        setServicePlans(plansData);
        setBillingSettings(settings);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data. Pastikan backend API sudah berjalan.",
          variant: "destructive",
        });
      }
    };
    loadData();
  }, [toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Nama lengkap harus diisi";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor telepon harus diisi";
    } else if (!/^[0-9]{10,13}$/.test(formData.phone.trim())) {
      newErrors.phone = "Nomor telepon tidak valid (10-13 digit)";
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email tidak valid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    // Alamat tidak wajib, langsung return true
    return true;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.servicePlanId) {
      newErrors.servicePlanId = "Paket layanan harus dipilih";
    }
    if (!formData.serviceType) {
      newErrors.serviceType = "Jenis layanan harus dipilih";
    }
    // Validate PPPoE settings
    if (formData.serviceType === "pppoe") {
      if (!formData.pppoeUsername.trim()) {
        newErrors.pppoeUsername = "Username PPPoE harus diisi";
      }
      if (!formData.pppoePassword.trim()) {
        newErrors.pppoePassword = "Password PPPoE harus diisi";
      }
    }
    // Validate Static IP settings
    if (formData.serviceType === "static") {
      if (!formData.staticIp.trim()) {
        newErrors.staticIp = "IP Address harus diisi";
      }
      if (!formData.staticGateway.trim()) {
        newErrors.staticGateway = "Gateway harus diisi";
      }
      if (!formData.staticDns.trim()) {
        newErrors.staticDns = "DNS harus diisi";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const requestData: CreateCustomerRequest = {
        name: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone,
        address: formData.address || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        service_plan_id: formData.servicePlanId,
        service_type: formData.serviceType as 'dhcp' | 'pppoe' | 'static',
        pppoe_username: formData.serviceType === 'pppoe' ? formData.pppoeUsername : undefined,
        pppoe_password: formData.serviceType === 'pppoe' ? formData.pppoePassword : undefined,
        static_ip: formData.serviceType === 'static' ? formData.staticIp : undefined,
        static_gateway: formData.serviceType === 'static' ? formData.staticGateway : undefined,
        static_dns: formData.serviceType === 'static' ? formData.staticDns : undefined,
        installation_date: new Date().toISOString(),
        due_date: 15,
        monthly_fee: servicePlans.find((p) => p.id === formData.servicePlanId)?.price || 0,
      };

      const newCustomer = await customerApi.createCustomer(requestData);

      if (newCustomer) {
        // Jika prepaid, langsung buat invoice
        console.log("Billing settings:", billingSettings);
        console.log("Billing type:", billingSettings?.billing_type);
        
        if (billingSettings?.billing_type === 'prepaid') {
          console.log("Creating invoice for prepaid customer:", newCustomer.id);
          try {
            const invoiceData = {
              customer_id: newCustomer.id,
              amount: newCustomer.monthly_fee || 0,
              payment_date: "",
              payment_method: "",
              notes: `Invoice pertama - Periode ${format(new Date(), 'MMMM yyyy')}`,
            };
            console.log("Invoice data:", invoiceData);
            
            const invoice = await paymentApi.create(invoiceData);
            console.log("Invoice created:", invoice);
            
            toast({
              title: "Pelanggan & Invoice Berhasil Dibuat",
              description: `${newCustomer.name} telah terdaftar dengan kode ${newCustomer.customer_code}. Invoice pertama telah dibuat.`,
            });
          } catch (invoiceError) {
            console.error("Error creating invoice:", invoiceError);
            toast({
              title: "Pelanggan Berhasil Ditambahkan",
              description: `${newCustomer.name} telah terdaftar. Namun gagal membuat invoice otomatis.`,
              variant: "default",
            });
          }
        } else {
          toast({
            title: "Pelanggan Berhasil Ditambahkan",
            description: `${newCustomer.name} telah terdaftar dengan kode ${newCustomer.customer_code}`,
          });
        }
        navigate("/pelanggan");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menambahkan pelanggan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = servicePlans.find((p) => p.id === formData.servicePlanId);

  const steps: WizardStep[] = useMemo(
    () => [
      {
        id: "personal",
        title: "Data Pribadi",
        description: "Informasi pelanggan",
        icon: <User className="h-5 w-5" />,
        validate: validateStep1,
        content: (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={errors.fullName ? "border-red-500" : ""}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Nomor Telepon <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                  placeholder="08xxxxxxxxxx"
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
             
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "address",
        title: "Alamat",
        description: "Lokasi pemasangan",
        icon: <MapPin className="h-5 w-5" />,
        validate: validateStep2,
        content: (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Detail Alamat</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Masukkan alamat lengkap pemasangan"
                rows={3}
              />
            </div>
            <LocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={(lat, lng) => {
                setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
              }}
            />
          </div>
        ),
      },
      {
        id: "service",
        title: "Paket Layanan",
        description: "Pilih paket internet",
        icon: <Wifi className="h-5 w-5" />,
        validate: validateStep3,
        content: (
          <div className="space-y-6">
            {/* Paket Internet - Simple Select */}
            <div className="space-y-2">
              <Label>
                Paket Internet <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.servicePlanId}
                onValueChange={(value) => handleInputChange("servicePlanId", value)}
              >
                <SelectTrigger className={errors.servicePlanId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Pilih paket internet" />
                </SelectTrigger>
                <SelectContent>
                  {servicePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.speed_download}Mbps - Rp{" "}
                      {(plan.price || 0).toLocaleString("id-ID")}/bln
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.servicePlanId && (
                <p className="text-sm text-red-500">{errors.servicePlanId}</p>
              )}
            </div>

            {/* Jenis Layanan - Simple Select */}
            <div className="space-y-2">
              <Label>
                Jenis Layanan <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => handleInputChange("serviceType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dhcp">DHCP (Otomatis)</SelectItem>
                  <SelectItem value="pppoe">PPPoE (Username/Password)</SelectItem>
                  <SelectItem value="static">Static IP (Manual)</SelectItem>
                </SelectContent>
              </Select>
              {errors.serviceType && (
                <p className="text-sm text-red-500">{errors.serviceType}</p>
              )}
            </div>

            {/* PPPoE Settings */}
            {formData.serviceType === "pppoe" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pppoeUsername">
                    Username PPPoE <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pppoeUsername"
                    value={formData.pppoeUsername}
                    onChange={(e) => handleInputChange("pppoeUsername", e.target.value)}
                    className={errors.pppoeUsername ? "border-red-500" : ""}
                    placeholder="username"
                  />
                  {errors.pppoeUsername && (
                    <p className="text-sm text-red-500">{errors.pppoeUsername}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pppoePassword">
                    Password PPPoE <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pppoePassword"
                    type="password"
                    value={formData.pppoePassword}
                    onChange={(e) => handleInputChange("pppoePassword", e.target.value)}
                    className={errors.pppoePassword ? "border-red-500" : ""}
                    placeholder="••••••••"
                  />
                  {errors.pppoePassword && (
                    <p className="text-sm text-red-500">{errors.pppoePassword}</p>
                  )}
                </div>
              </div>
            )}

            {/* Static IP Settings */}
            {formData.serviceType === "static" && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="staticIp">
                    IP Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="staticIp"
                    value={formData.staticIp}
                    onChange={(e) => handleInputChange("staticIp", e.target.value)}
                    className={errors.staticIp ? "border-red-500" : ""}
                    placeholder="192.168.1.100"
                  />
                  {errors.staticIp && <p className="text-sm text-red-500">{errors.staticIp}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staticGateway">
                    Gateway <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="staticGateway"
                    value={formData.staticGateway}
                    onChange={(e) => handleInputChange("staticGateway", e.target.value)}
                    className={errors.staticGateway ? "border-red-500" : ""}
                    placeholder="192.168.1.1"
                  />
                  {errors.staticGateway && (
                    <p className="text-sm text-red-500">{errors.staticGateway}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staticDns">
                    DNS <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="staticDns"
                    value={formData.staticDns}
                    onChange={(e) => handleInputChange("staticDns", e.target.value)}
                    className={errors.staticDns ? "border-red-500" : ""}
                    placeholder="8.8.8.8"
                  />
                  {errors.staticDns && <p className="text-sm text-red-500">{errors.staticDns}</p>}
                </div>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "confirmation",
        title: "Konfirmasi",
        description: "Review data",
        icon: <CreditCard className="h-5 w-5" />,
        content: (
          <div className="space-y-4">
            {/* Prepaid Notice */}
            {billingSettings?.billing_type === 'prepaid' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Mode Prepaid:</strong> Invoice pertama akan langsung dibuat setelah pelanggan ditambahkan.
                </p>
              </div>
            )}

            {/* Data Pelanggan */}
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-medium">{formData.fullName || "-"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Telepon</span>
                <span className="font-medium">{formData.phone || "-"}</span>
              </div>
              {formData.email && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
              )}
              {formData.address && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Alamat</span>
                  <span className="font-medium text-right max-w-[60%]">{formData.address}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Paket</span>
                <span className="font-medium">{selectedPlan?.name || "-"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Jenis Layanan</span>
                <span className="font-medium">
                  {formData.serviceType === "dhcp"
                    ? "DHCP"
                    : formData.serviceType === "pppoe"
                    ? "PPPoE"
                    : "Static IP"}
                </span>
              </div>
              {formData.serviceType === "pppoe" && formData.pppoeUsername && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Username PPPoE</span>
                  <span className="font-medium">{formData.pppoeUsername}</span>
                </div>
              )}
              {formData.serviceType === "static" && formData.staticIp && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">IP Address</span>
                  <span className="font-medium">{formData.staticIp}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Biaya Bulanan</span>
                <span className="font-bold text-primary">
                  Rp {(selectedPlan?.price || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [formData, errors, servicePlans, selectedPlan, billingSettings]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pelanggan")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "create" ? "Tambah Pelanggan Baru" : "Edit Pelanggan"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Lengkapi form di bawah untuk mendaftarkan pelanggan baru"
              : "Update data pelanggan"}
          </p>
        </div>
      </div>

      <WizardForm
        steps={steps}
        onComplete={handleSubmit}
        onCancel={() => navigate("/pelanggan")}
        submitLabel="Simpan Pelanggan"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default CustomerForm;
