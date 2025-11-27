import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Gift, Calendar, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Voucher {
  id: string;
  code: string;
  status: string;
  issue_date: string;
  expiry_date: string;
  redemption_date?: string;
  purchase_price: number;
  user_id: string;
  experiences?: {
    title: string;
  };
}

interface UserProfile {
  full_name: string | null;
  email: string;
}

const ManageOrders = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select(`
          *,
          experiences (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const vouchersData = data || [];
      setVouchers(vouchersData);

      // Fetch user profiles separately
      const userIds = [...new Set(vouchersData.map(v => v.user_id))];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (!profilesError && profiles) {
          const profilesMap: Record<string, UserProfile> = {};
          profiles.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name, email: p.email };
          });
          setUserProfiles(profilesMap);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu am putut încărca voucherele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: 'default', label: 'Activ', icon: CheckCircle },
      used: { variant: 'secondary', label: 'Folosit', icon: CheckCircle },
      expired: { variant: 'destructive', label: 'Expirat', icon: XCircle },
      exchanged: { variant: 'outline', label: 'Schimbat', icon: Gift },
      transferred: { variant: 'outline', label: 'Transferat', icon: Gift },
    };
    const config = variants[status] || variants.active;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filterByStatus = (status?: string) => {
    if (!status) return vouchers;
    return vouchers.filter((v) => v.status === status);
  };

  const VouchersTable = ({ vouchers }: { vouchers: Voucher[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cod Voucher</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Experiență</TableHead>
          <TableHead>Valoare</TableHead>
          <TableHead>Data Emiterii</TableHead>
          <TableHead>Expirare</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vouchers.map((voucher) => (
          <TableRow key={voucher.id}>
            <TableCell className="font-mono font-medium">{voucher.code}</TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{userProfiles[voucher.user_id]?.full_name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{userProfiles[voucher.user_id]?.email || 'N/A'}</div>
              </div>
            </TableCell>
            <TableCell>{voucher.experiences?.title || 'N/A'}</TableCell>
            <TableCell className="font-medium">{voucher.purchase_price} RON</TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(new Date(voucher.issue_date), 'dd MMM yyyy')}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {format(new Date(voucher.expiry_date), 'dd MMM yyyy')}
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(voucher.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Vouchere & Comenzi</h2>
            <p className="text-muted-foreground">
              Gestionează toate voucherele și comenzile
            </p>
          </div>
          <Button onClick={() => navigate('/admin/orders/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Creează Voucher
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista Vouchere ({vouchers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Toate ({vouchers.length})</TabsTrigger>
                  <TabsTrigger value="active">
                    Active ({filterByStatus('active').length})
                  </TabsTrigger>
                  <TabsTrigger value="used">
                    Folosite ({filterByStatus('used').length})
                  </TabsTrigger>
                  <TabsTrigger value="expired">
                    Expirate ({filterByStatus('expired').length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <VouchersTable vouchers={vouchers} />
                </TabsContent>
                <TabsContent value="active">
                  <VouchersTable vouchers={filterByStatus('active')} />
                </TabsContent>
                <TabsContent value="used">
                  <VouchersTable vouchers={filterByStatus('used')} />
                </TabsContent>
                <TabsContent value="expired">
                  <VouchersTable vouchers={filterByStatus('expired')} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ManageOrders;
