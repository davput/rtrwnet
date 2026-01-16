import { useState, useRef } from "react";
import { customerApi } from "./customer.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

export function ImportExportDialog({ open, onOpenChange, onImportSuccess }: ImportExportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await customerApi.exportCustomers();
      toast({
        title: "Export Berhasil",
        description: "Data pelanggan berhasil diexport ke CSV",
      });
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: error instanceof Error ? error.message : "Gagal mengexport data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await customerApi.downloadTemplate();
      toast({
        title: "Template Diunduh",
        description: "Template import berhasil diunduh",
      });
    } catch (error) {
      toast({
        title: "Gagal Mengunduh Template",
        description: error instanceof Error ? error.message : "Gagal mengunduh template",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Format File Salah",
        description: "Hanya file CSV yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await customerApi.importCustomers(file);
      setImportResult(result);
      
      if (result.imported > 0) {
        toast({
          title: "Import Selesai",
          description: `${result.imported} pelanggan berhasil diimport`,
        });
        onImportSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Import Gagal",
        description: error instanceof Error ? error.message : "Gagal mengimport data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import / Export Data Pelanggan</DialogTitle>
          <DialogDescription>
            Export data pelanggan ke CSV atau import dari file CSV
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="text-center py-6 border-2 border-dashed rounded-lg">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Export Data Pelanggan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download semua data pelanggan dalam format CSV
              </p>
              <Button onClick={handleExport} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Mengexport..." : "Export ke CSV"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Import Data Pelanggan</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload file CSV untuk menambahkan pelanggan baru
                </p>
                
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isImporting ? "Mengimport..." : "Pilih File CSV"}
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {importResult && (
                <div className="space-y-2">
                  {importResult.imported > 0 && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        {importResult.imported} pelanggan berhasil diimport
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {importResult.failed > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {importResult.failed} baris gagal diimport
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                      {importResult.errors.map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Format CSV:</strong> name*, phone*, email, address, latitude, longitude, 
                  service_plan_id*, service_type*, pppoe_username, pppoe_password, 
                  static_ip, static_gateway, static_dns, due_date, monthly_fee, notes
                  <br />
                  <span className="text-xs">* = wajib diisi</span>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default ImportExportDialog;
