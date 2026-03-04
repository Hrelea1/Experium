import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Eye } from "lucide-react";

interface PartnerApp {
  id: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  city: string;
  experience_type: string;
  description: string;
  website: string | null;
  status: string;
  created_at: string | null;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "secondary",
  contacted: "outline",
  approved: "default",
  rejected: "destructive",
};

const ManagePartnerApplications = () => {
  const [apps, setApps] = useState<PartnerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PartnerApp | null>(null);
  const { toast } = useToast();

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partner_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setApps(data);
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("partner_applications").update({ status }).eq("id", id);
    if (!error) {
      toast({ title: "Status actualizat" });
      fetchApps();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Aplicații Parteneri</h1>
          <p className="text-muted-foreground">Gestionează aplicațiile de parteneriat</p>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Oraș</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : apps.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nicio aplicație</TableCell></TableRow>
              ) : apps.map(app => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.full_name}</TableCell>
                  <TableCell>{app.business_name}</TableCell>
                  <TableCell>{app.city}</TableCell>
                  <TableCell>{app.experience_type}</TableCell>
                  <TableCell>
                    <Select value={app.status} onValueChange={v => updateStatus(app.id, v)}>
                      <SelectTrigger className="w-32 h-8">
                        <Badge variant={statusColors[app.status] || "secondary"}>{app.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {app.created_at ? format(new Date(app.created_at), "d MMM yyyy", { locale: ro }) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(app)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalii Aplicație</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><strong>Nume:</strong> {selected.full_name}</div>
              <div><strong>Business:</strong> {selected.business_name}</div>
              <div><strong>Email:</strong> {selected.email}</div>
              <div><strong>Telefon:</strong> {selected.phone}</div>
              <div><strong>Oraș:</strong> {selected.city}</div>
              <div><strong>Tip experiență:</strong> {selected.experience_type}</div>
              <div><strong>Descriere:</strong> {selected.description}</div>
              {selected.website && <div><strong>Website:</strong> <a href={selected.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">{selected.website}</a></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ManagePartnerApplications;
