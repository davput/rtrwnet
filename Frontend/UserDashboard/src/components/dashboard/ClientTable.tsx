
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { customerApi } from "@/features/customers/customer.api";
import type { Customer } from "@/features/customers/customer.types";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { formatDateWIB } from "@/lib/dateUtils";

export function ClientTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getCustomers({ per_page: 5 });
      setCustomers(data.customers);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Pelanggan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Pelanggan Terbaru</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/pelanggan")}>
          Lihat Semua
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Tgl Daftar</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Belum ada data pelanggan
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{customer.address}</TableCell>
                  <TableCell>
                    <StatusBadge status={customer.status} />
                  </TableCell>
                  <TableCell>
                    {(customer as any).service_plan?.name || "-"}
                  </TableCell>
                  <TableCell>
                    {customer.registration_date 
                      ? formatDateWIB(customer.registration_date, "dd MMM yyyy")
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/pelanggan/${customer.id}`)}>
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/pelanggan/${customer.id}/edit`)}>
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return {
          label: "Aktif",
          className: "bg-green-100 text-green-800 border-green-200"
        };
      case "suspended":
        return {
          label: "Suspended",
          className: "bg-red-100 text-red-800 border-red-200"
        };
      case "pending":
        return {
          label: "Menunggu",
          className: "bg-amber-100 text-amber-800 border-amber-200"
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-800 border-gray-200"
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
