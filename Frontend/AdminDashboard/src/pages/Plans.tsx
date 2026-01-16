import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Check, Users, Building2, Loader2, Settings, Zap, Shield, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionPlan, CreatePlanRequest, PlanLimits, PlanFeatures, TrialConfig } from "@/types";
import { DEFAULT_PLAN_LIMITS, DEFAULT_PLAN_FEATURES, DEFAULT_TRIAL_CONFIG } from "@/types";
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from "@/hooks/useAdmin";

function parsePlanLimits(limits: PlanLimits | string | undefined): PlanLimits {
  if (!limits) return DEFAULT_PLAN_LIMITS;
  if (typeof limits === "string") { try { return JSON.parse(limits); } catch { return DEFAULT_PLAN_LIMITS; } }
  return limits;
}

function parsePlanFeatures(features: PlanFeatures | string | undefined): PlanFeatures {
  if (!features) return DEFAULT_PLAN_FEATURES;
  if (typeof features === "string") { try { return JSON.parse(features); } catch { return DEFAULT_PLAN_FEATURES; } }
  return features;
}

function parseTrialConfig(config: TrialConfig | string | undefined): TrialConfig {
  if (!config) return DEFAULT_TRIAL_CONFIG;
  if (typeof config === "string") { try { return JSON.parse(config); } catch { return DEFAULT_TRIAL_CONFIG; } }
  return config;
}

const FEATURE_CATEGORIES = {
  core: { label: "Fitur Inti", features: ["customer_management", "billing_management", "device_management", "network_monitoring", "user_management"] },
  advanced: { label: "Fitur Lanjutan", features: ["mikrotik_integration", "hotspot_management", "vlan_management", "firewall_management", "queue_management", "speed_boost"] },
  monitoring: { label: "Monitoring & Analytics", features: ["real_time_monitoring", "advanced_reports", "custom_dashboard", "data_export", "alert_system"] },
  integration: { label: "Integrasi", features: ["api_access", "webhook_support", "third_party_integration", "custom_branding", "white_label"] },
  support: { label: "Support", features: ["priority_support", "phone_support", "dedicated_manager", "custom_training"] }
};

const FEATURE_LABELS: Record<string, string> = {
  customer_management: "Manajemen Pelanggan", billing_management: "Manajemen Billing", device_management: "Manajemen Perangkat",
  network_monitoring: "Monitoring Jaringan", user_management: "Manajemen User", mikrotik_integration: "Integrasi Mikrotik",
  hotspot_management: "Manajemen Hotspot", vlan_management: "Manajemen VLAN", firewall_management: "Manajemen Firewall",
  queue_management: "Manajemen Queue", speed_boost: "Speed Boost", real_time_monitoring: "Monitoring Real-time",
  advanced_reports: "Laporan Lanjutan", custom_dashboard: "Dashboard Kustom", data_export: "Export Data",
  alert_system: "Sistem Alert", api_access: "Akses API", webhook_support: "Webhook Support",
  third_party_integration: "Integrasi Pihak Ketiga", custom_branding: "Custom Branding", white_label: "White Label",
  priority_support: "Support Prioritas", phone_support: "Support Telepon", dedicated_manager: "Account Manager", custom_training: "Training Kustom"
};

const LIMIT_LABELS: Record<string, { label: string; unit: string }> = {
  max_customers: { label: "Max Pelanggan", unit: "" }, max_users: { label: "Max Users", unit: "" },
  max_devices: { label: "Max Perangkat", unit: "" }, max_bandwidth: { label: "Max Bandwidth", unit: "Mbps" },
  max_storage: { label: "Max Storage", unit: "GB" }, max_hotspots: { label: "Max Hotspot", unit: "" },
  max_vlans: { label: "Max VLAN", unit: "" }, max_firewall_rules: { label: "Max Firewall Rules", unit: "" },
  max_queue_rules: { label: "Max Queue Rules", unit: "" }, max_monitoring_days: { label: "Retensi Monitoring", unit: "hari" },
  max_reports: { label: "Max Laporan/bulan", unit: "" }, max_alerts: { label: "Max Alert Aktif", unit: "" },
  max_api_calls_per_hour: { label: "Max API Calls/jam", unit: "" }, max_webhooks: { label: "Max Webhooks", unit: "" }
};

export function Plans() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", price: 0, billing_cycle: "monthly" as "monthly" | "yearly", is_public: true, is_trial: false, sort_order: 0 });
  const [limits, setLimits] = useState<PlanLimits>(DEFAULT_PLAN_LIMITS);
  const [features, setFeatures] = useState<PlanFeatures>(DEFAULT_PLAN_FEATURES);
  const [trialConfig, setTrialConfig] = useState<TrialConfig>(DEFAULT_TRIAL_CONFIG);

  const { data: plansData, isLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const plans = plansData?.data || [];

  const openCreateDialog = () => {
    setEditPlan(null);
    setFormData({ name: "", slug: "", description: "", price: 0, billing_cycle: "monthly", is_public: true, is_trial: false, sort_order: plans.length });
    setLimits(DEFAULT_PLAN_LIMITS);
    setFeatures(DEFAULT_PLAN_FEATURES);
    setTrialConfig(DEFAULT_TRIAL_CONFIG);
    setActiveTab("basic");
    setDialogOpen(true);
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditPlan(plan);
    setFormData({ name: plan.name, slug: plan.slug || "", description: plan.description, price: plan.price, billing_cycle: plan.billing_cycle, is_public: plan.is_public ?? true, is_trial: plan.is_trial ?? false, sort_order: plan.sort_order ?? 0 });
    setLimits(parsePlanLimits(plan.limits));
    setFeatures(parsePlanFeatures(plan.plan_features));
    setTrialConfig(parseTrialConfig(plan.trial_config));
    setActiveTab("basic");
    setDialogOpen(true);
  };

  const resetForm = () => { setDialogOpen(false); setEditPlan(null); };

  useEffect(() => {
    if (!editPlan && formData.name) {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, editPlan]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) { toast.error("Nama dan slug wajib diisi"); return; }
    const data: CreatePlanRequest = { ...formData, max_customers: limits.max_customers, max_users: limits.max_users, features: Object.entries(features).filter(([, v]) => v).map(([k]) => k), limits, plan_features: features, trial_config: trialConfig };
    try {
      if (editPlan) { await updatePlan.mutateAsync({ id: editPlan.id, data }); toast.success("Paket berhasil diperbarui"); }
      else { await createPlan.mutateAsync(data); toast.success("Paket berhasil dibuat"); }
      resetForm();
    } catch (error: any) { toast.error(error?.response?.data?.message || "Gagal menyimpan paket"); }
  };

  const handleDelete = async () => {
    if (!deletePlanId) return;
    try { await deletePlan.mutateAsync(deletePlanId); toast.success("Paket berhasil dihapus"); setDeletePlanId(null); }
    catch (error: any) { toast.error(error?.response?.data?.message || "Gagal menghapus paket"); }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try { await updatePlan.mutateAsync({ id: plan.id, data: { is_active: !plan.is_active } as any }); toast.success(`Paket ${plan.is_active ? "dinonaktifkan" : "diaktifkan"}`); }
    catch (error: any) { toast.error(error?.response?.data?.message || "Gagal mengubah status"); }
  };

  const countEnabledFeatures = (plan: SubscriptionPlan) => Object.values(parsePlanFeatures(plan.plan_features)).filter(Boolean).length;

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Paket Langganan</h1><p className="text-muted-foreground">Kelola paket langganan dengan limits dan fitur kustom</p></div></div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-[450px]" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Paket Langganan</h1><p className="text-muted-foreground">Kelola paket langganan dengan limits dan fitur kustom</p></div>
        <Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" />Tambah Paket</Button>
      </div>

      {plans.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Belum ada paket langganan</p><Button className="mt-4" onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" />Buat Paket Pertama</Button></CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((plan) => {
            const planLimits = parsePlanLimits(plan.limits);
            const planFeatures = parsePlanFeatures(plan.plan_features);
            const planTrialConfig = parseTrialConfig(plan.trial_config);
            return (
              <Card key={plan.id} className={`relative ${!plan.is_active ? "opacity-60" : ""}`}>
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  {plan.is_trial && <Badge variant="secondary">Trial</Badge>}
                  {!plan.is_active && <Badge variant="outline">Nonaktif</Badge>}
                  {!plan.is_public && <Badge variant="outline">Private</Badge>}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(plan)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletePlanId(plan.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div><span className="text-3xl font-bold">{formatCurrency(plan.price)}</span><span className="text-muted-foreground">/{plan.billing_cycle === "monthly" ? "bulan" : "tahun"}</span></div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 p-2 bg-muted/50 rounded"><Users className="h-4 w-4 text-blue-600" /><span>{planLimits.max_customers === -1 ? "∞" : planLimits.max_customers} pelanggan</span></div>
                    <div className="flex items-center gap-1.5 p-2 bg-muted/50 rounded"><Building2 className="h-4 w-4 text-green-600" /><span>{planLimits.max_users === -1 ? "∞" : planLimits.max_users} users</span></div>
                    <div className="flex items-center gap-1.5 p-2 bg-muted/50 rounded"><Zap className="h-4 w-4 text-yellow-600" /><span>{countEnabledFeatures(plan)} fitur</span></div>
                    <div className="flex items-center gap-1.5 p-2 bg-muted/50 rounded"><Clock className="h-4 w-4 text-purple-600" /><span>{planTrialConfig.trial_days} hari trial</span></div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">FITUR UTAMA</p>
                    <div className="space-y-1.5">
                      {Object.entries(planFeatures).filter(([, v]) => v).slice(0, 4).map(([key]) => (
                        <div key={key} className="flex items-center gap-2 text-sm"><Check className="h-3.5 w-3.5 text-green-600" /><span>{FEATURE_LABELS[key] || key}</span></div>
                      ))}
                      {countEnabledFeatures(plan) > 4 && <p className="text-xs text-muted-foreground">+{countEnabledFeatures(plan) - 4} fitur lainnya</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3"><span className="text-sm text-muted-foreground">Status Aktif</span><Switch checked={plan.is_active} onCheckedChange={() => handleToggleActive(plan)} /></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editPlan ? "Edit Paket" : "Tambah Paket Baru"}</DialogTitle><DialogDescription>Konfigurasi paket langganan dengan limits dan fitur yang tersedia</DialogDescription></DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="basic">Info Dasar</TabsTrigger><TabsTrigger value="limits">Resource Limits</TabsTrigger><TabsTrigger value="features">Fitur</TabsTrigger><TabsTrigger value="trial">Trial</TabsTrigger></TabsList>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Nama Paket *</Label><Input placeholder="Professional" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Slug *</Label><Input placeholder="professional" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Deskripsi</Label><Input placeholder="Deskripsi paket langganan" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label>Harga (Rp)</Label><Input type="number" placeholder="599000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Siklus Billing</Label><Select value={formData.billing_cycle} onValueChange={(v: "monthly" | "yearly") => setFormData({ ...formData, billing_cycle: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Bulanan</SelectItem><SelectItem value="yearly">Tahunan</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Urutan Tampil</Label><Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2"><Switch checked={formData.is_public} onCheckedChange={(v) => setFormData({ ...formData, is_public: v })} /><Label>Tampilkan di Halaman Pricing</Label></div>
                <div className="flex items-center gap-2"><Switch checked={formData.is_trial} onCheckedChange={(v) => setFormData({ ...formData, is_trial: v })} /><Label>Paket Trial</Label></div>
              </div>
            </TabsContent>
            <TabsContent value="limits" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Atur batasan resource untuk paket ini. Gunakan -1 untuk unlimited.</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(LIMIT_LABELS).map(([key, { label, unit }]) => (
                  <div key={key} className="space-y-2"><Label>{label} {unit && `(${unit})`}</Label><Input type="number" value={limits[key as keyof PlanLimits]} onChange={(e) => setLimits({ ...limits, [key]: parseInt(e.target.value) || 0 })} /></div>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => setLimits(DEFAULT_PLAN_LIMITS)}>Reset ke Starter</Button>
                <Button variant="outline" size="sm" onClick={() => setLimits({ ...DEFAULT_PLAN_LIMITS, max_customers: 200, max_users: 5, max_devices: 20, max_bandwidth: 500, max_storage: 50, max_hotspots: 10, max_vlans: 20, max_firewall_rules: 100, max_queue_rules: 50, max_monitoring_days: 90, max_reports: 20, max_alerts: 50, max_api_calls_per_hour: 1000, max_webhooks: 10 })}>Set Professional</Button>
                <Button variant="outline" size="sm" onClick={() => setLimits({ max_customers: -1, max_users: -1, max_devices: -1, max_bandwidth: -1, max_storage: -1, max_hotspots: -1, max_vlans: -1, max_firewall_rules: -1, max_queue_rules: -1, max_monitoring_days: 365, max_reports: -1, max_alerts: -1, max_api_calls_per_hour: -1, max_webhooks: -1 })}>Set Enterprise</Button>
              </div>
            </TabsContent>
            <TabsContent value="features" className="space-y-6 mt-4">
              <p className="text-sm text-muted-foreground">Pilih fitur yang tersedia untuk paket ini.</p>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => setFeatures(DEFAULT_PLAN_FEATURES)}>Reset ke Starter</Button>
                <Button variant="outline" size="sm" onClick={() => { const prof = { ...DEFAULT_PLAN_FEATURES }; Object.keys(prof).forEach(k => { if (!["third_party_integration", "white_label", "phone_support", "dedicated_manager", "custom_training"].includes(k)) (prof as any)[k] = true; }); setFeatures(prof); }}>Set Professional</Button>
                <Button variant="outline" size="sm" onClick={() => { const all = { ...DEFAULT_PLAN_FEATURES }; Object.keys(all).forEach(k => (all as any)[k] = true); setFeatures(all); }}>Set Enterprise</Button>
              </div>
              {Object.entries(FEATURE_CATEGORIES).map(([catKey, { label, features: catFeatures }]) => (
                <div key={catKey} className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">{catKey === "core" && <Settings className="h-4 w-4" />}{catKey === "advanced" && <Zap className="h-4 w-4" />}{catKey === "monitoring" && <Shield className="h-4 w-4" />}{label}</h4>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {catFeatures.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50"><Switch checked={features[feat as keyof PlanFeatures]} onCheckedChange={(v) => setFeatures({ ...features, [feat]: v })} /><Label className="cursor-pointer flex-1">{FEATURE_LABELS[feat]}</Label></div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="trial" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Konfigurasi periode trial untuk paket ini.</p>
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Durasi Trial (hari)</Label><Input type="number" value={trialConfig.trial_days} onChange={(e) => setTrialConfig({ ...trialConfig, trial_days: parseInt(e.target.value) || 14 })} /></div></div>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Switch checked={trialConfig.trial_enabled} onCheckedChange={(v) => setTrialConfig({ ...trialConfig, trial_enabled: v })} /><Label>Aktifkan Trial untuk Paket Ini</Label></div>
                <div className="flex items-center gap-2"><Switch checked={trialConfig.require_payment} onCheckedChange={(v) => setTrialConfig({ ...trialConfig, require_payment: v })} /><Label>Wajib Input Metode Pembayaran untuk Trial</Label></div>
                <div className="flex items-center gap-2"><Switch checked={trialConfig.auto_convert} onCheckedChange={(v) => setTrialConfig({ ...trialConfig, auto_convert: v })} /><Label>Otomatis Konversi ke Berbayar Setelah Trial</Label></div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6"><Button variant="outline" onClick={resetForm}>Batal</Button><Button onClick={handleSubmit} disabled={createPlan.isPending || updatePlan.isPending}>{(createPlan.isPending || updatePlan.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editPlan ? "Simpan Perubahan" : "Buat Paket"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePlanId} onOpenChange={(open) => !open && setDeletePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Paket?</AlertDialogTitle><AlertDialogDescription>Paket ini akan dihapus permanen. Pastikan tidak ada tenant yang menggunakan paket ini.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{deletePlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
