import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Gift, 
  Users, 
  Plus, 
  Eye,
  UserPlus,
  BarChart3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AmbassadorStats {
  active_experiences_count: number;
  total_revenue: number;
  total_sales: number;
}

interface AmbassadorExperience {
  id: string;
  title: string;
  location_name: string;
  price: number;
  is_active: boolean;
  created_at: string;
  voucher_count?: number;
  revenue?: number;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

export default function AmbassadorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AmbassadorStats | null>(null);
  const [experiences, setExperiences] = useState<AmbassadorExperience[]>([]);
  const [providers, setProviders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch ambassador stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_ambassador_stats', { ambassador_user_id: user.id });

      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Fetch ambassador's experiences with sales data
      const { data: expData, error: expError } = await supabase
        .from('experiences')
        .select('*')
        .eq('ambassador_id', user.id)
        .order('created_at', { ascending: false });

      if (expError) throw expError;

      // Get voucher counts for each experience
      const experiencesWithStats = await Promise.all(
        (expData || []).map(async (exp) => {
          const { count, data: voucherData } = await supabase
            .from('vouchers')
            .select('purchase_price', { count: 'exact' })
            .eq('experience_id', exp.id);

          const revenue = voucherData?.reduce((sum, v) => sum + (v.purchase_price || 0), 0) || 0;

          return {
            ...exp,
            voucher_count: count || 0,
            revenue,
          };
        })
      );

      setExperiences(experiencesWithStats);

      // Fetch available providers (users with provider role)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'provider');

      if (rolesError) throw rolesError;

      if (rolesData && rolesData.length > 0) {
        const providerIds = rolesData.map(r => r.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', providerIds);

        if (profilesError) throw profilesError;
        setProviders(profilesData || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Eroare',
        description: 'Nu am putut încărca datele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const assignProvider = async () => {
    if (!user || !selectedExperience || !selectedProvider) {
      toast({
        title: 'Date incomplete',
        description: 'Selectează experiența și furnizorul',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('experience_providers')
        .insert({
          experience_id: selectedExperience,
          provider_user_id: selectedProvider,
          assigned_by: user.id,
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Furnizor deja asignat',
            description: 'Acest furnizor este deja asignat acestei experiențe',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Succes',
          description: 'Furnizorul a fost asignat experiției',
        });
        setDialogOpen(false);
        setSelectedExperience('');
        setSelectedProvider('');
      }
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 container">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Ambasador</h1>
              <p className="text-muted-foreground">
                Gestionează experiențele tale și urmărește vânzările
              </p>
            </div>
            <Button asChild>
              <Link to="/ambassador/create-experience">
                <Plus className="h-4 w-4 mr-2" />
                Creează Experiență
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Experiențe Active</p>
                    <p className="text-2xl font-bold">{stats?.active_experiences_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Venituri Totale</p>
                    <p className="text-2xl font-bold">{stats?.total_revenue?.toLocaleString() || 0} Lei</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vânzări Totale</p>
                    <p className="text-2xl font-bold">{stats?.total_sales || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experiences List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Experiențele Tale</CardTitle>
                <CardDescription>
                  Lista experiențelor create de tine
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={experiences.length === 0 || providers.length === 0}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Asignează Furnizor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignează Furnizor</DialogTitle>
                    <DialogDescription>
                      Selectează experiența și furnizorul care o va gestiona
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Experiență</label>
                      <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează experiența" />
                        </SelectTrigger>
                        <SelectContent>
                          {experiences.map((exp) => (
                            <SelectItem key={exp.id} value={exp.id}>
                              {exp.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Furnizor</label>
                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează furnizorul" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.full_name || provider.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={assignProvider} className="w-full">
                      Asignează
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {experiences.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nu ai creat nicio experiență încă.
                  </p>
                  <Button asChild>
                    <Link to="/ambassador/create-experience">
                      <Plus className="h-4 w-4 mr-2" />
                      Creează Prima Experiență
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{exp.title}</h4>
                          <Badge variant={exp.is_active ? 'default' : 'secondary'}>
                            {exp.is_active ? 'Activ' : 'Inactiv'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{exp.location_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-primary font-medium">{exp.price} Lei</span>
                          <span className="text-muted-foreground">
                            {exp.voucher_count} vânzări
                          </span>
                          <span className="text-green-600 font-medium">
                            {exp.revenue?.toLocaleString()} Lei venituri
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/experience/${exp.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
