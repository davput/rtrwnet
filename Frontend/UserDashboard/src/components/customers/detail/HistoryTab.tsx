import { useState } from "react";
import type { Customer } from "@/features/customers/customer.types";
import type { ChangeType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Zap, 
  Activity, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  UserPlus,
  FileText,
  Calendar,
  Filter
} from "lucide-react";
import { historyService } from "@/services/historyService";

interface HistoryTabProps {
  customer: Customer;
  onDataChange?: () => void;
}

export function CustomerHistoryTab({ customer, onDataChange }: HistoryTabProps) {
  const [filterType, setFilterType] = useState<ChangeType | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const history = historyService.getHistoryByCustomer(customer.id, {
    changeType: filterType === 'all' ? undefined : filterType,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const stats = historyService.getStatistics(customer.id);

  const getIcon = (changeType: ChangeType) => {
    const iconName = historyService.getChangeTypeIcon(changeType);
    const iconMap: Record<string, any> = {
      User,
      Zap,
      Activity,
      MapPin,
      DollarSign,
      CheckCircle,
      UserPlus,
      FileText,
    };
    const IconComponent = iconMap[iconName] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Aktivitas</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pembayaran</p>
              <p className="text-3xl font-bold mt-2 text-emerald-600">
                {stats.byType.payment || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Perubahan Paket</p>
              <p className="text-3xl font-bold mt-2 text-purple-600">
                {stats.byType.plan_change || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Update Profil</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">
                {stats.byType.profile_update || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Riwayat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipe Aktivitas</Label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aktivitas</SelectItem>
                  <SelectItem value="registration">Registrasi</SelectItem>
                  <SelectItem value="activation">Aktivasi</SelectItem>
                  <SelectItem value="payment">Pembayaran</SelectItem>
                  <SelectItem value="plan_change">Perubahan Paket</SelectItem>
                  <SelectItem value="status_change">Perubahan Status</SelectItem>
                  <SelectItem value="profile_update">Update Profil</SelectItem>
                  <SelectItem value="relocation">Pindah Rumah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dari Tanggal</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sampai Tanggal</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail & Riwayat Aktivitas</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id} className="flex space-x-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${historyService.getChangeTypeColor(item.changeType)}`}>
                      {getIcon(item.changeType)}
                    </div>
                    {index < history.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className={historyService.getChangeTypeColor(item.changeType)}>
                            {historyService.getChangeTypeLabel(item.changeType)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.changedAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.changedAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{item.description}</p>
                        
                        {/* Show old/new values if available */}
                        {item.oldValue && item.newValue && (
                          <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-muted-foreground">Dari:</span>
                              <span className="font-medium line-through">{item.oldValue}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium text-green-600">{item.newValue}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{item.changedByName || 'System'}</span>
                      </div>
                      {item.fieldName && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>Field: {item.fieldName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {filterType !== 'all' || startDate || endDate
                  ? 'Tidak ada riwayat yang sesuai dengan filter'
                  : 'Belum ada riwayat aktivitas'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary by Month */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Aktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Aktivitas:</span>
                <span className="font-medium">{history.length} aktivitas</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Periode:</span>
                <span className="font-medium">
                  {new Date(history[history.length - 1].changedAt).toLocaleDateString('id-ID')} - {new Date(history[0].changedAt).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Aktivitas Terakhir:</span>
                <span className="font-medium">
                  {historyService.getChangeTypeLabel(history[0].changeType)} • {new Date(history[0].changedAt).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
