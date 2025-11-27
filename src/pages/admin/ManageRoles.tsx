import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, Trash2, Mail } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

const ManageRoles = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { email: string; full_name: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'moderator'>('moderator');
  const [granting, setGranting] = useState(false);
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPrimaryAdmin();
    fetchUserRoles();
  }, []);

  const checkPrimaryAdmin = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('is_primary_admin', {
        _user_id: user.id,
      });

      if (error) throw error;
      setIsPrimaryAdmin(data);
    } catch (error) {
      console.error('Error checking primary admin:', error);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rolesData = data || [];
      setUserRoles(rolesData);

      // Fetch profiles for all users
      const userIds = [...new Set(rolesData.map(r => r.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const profilesMap: Record<string, { email: string; full_name: string | null }> = {};
          profilesData.forEach(p => {
            profilesMap[p.id] = { email: p.email, full_name: p.full_name };
          });
          setProfiles(profilesMap);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu am putut încărca rolurile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const grantRole = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: 'Eroare',
        description: 'Introdu adresa de email',
        variant: 'destructive',
      });
      return;
    }

    if (!isPrimaryAdmin) {
      toast({
        title: 'Acces Interzis',
        description: 'Doar administratorul principal poate acorda roluri',
        variant: 'destructive',
      });
      return;
    }

    setGranting(true);

    try {
      // First, find the user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', newUserEmail.trim().toLowerCase())
        .single();

      if (profileError || !profiles) {
        toast({
          title: 'Utilizator Negăsit',
          description: 'Nu există un cont cu această adresă de email',
          variant: 'destructive',
        });
        return;
      }

      // Grant the role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: profiles.id,
          role: newUserRole,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Rol Existent',
            description: 'Acest utilizator are deja acest rol',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Succes!',
          description: `Rolul ${newUserRole} a fost acordat`,
        });

        setNewUserEmail('');
        fetchUserRoles();
      }
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut acorda rolul',
        variant: 'destructive',
      });
    } finally {
      setGranting(false);
    }
  };

  const revokeRole = async (roleId: string, userEmail: string) => {
    if (userEmail === 'hrelea001@gmail.com') {
      toast({
        title: 'Acțiune Interzisă',
        description: 'Nu poți revoca rolul administratorului principal',
        variant: 'destructive',
      });
      return;
    }

    if (!isPrimaryAdmin) {
      toast({
        title: 'Acces Interzis',
        description: 'Doar administratorul principal poate revoca roluri',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Rolul a fost revocat',
      });

      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut revoca rolul',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      admin: { variant: 'default', label: 'Admin' },
      moderator: { variant: 'secondary', label: 'Moderator' },
      user: { variant: 'outline', label: 'User' },
    };
    const config = variants[role] || variants.user;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!isPrimaryAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Doar administratorul principal (hrelea001@gmail.com) poate gestiona rolurile
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Gestionare Roluri</h2>
          <p className="text-muted-foreground">
            Acordă și gestionează rolurile utilizatorilor
          </p>
        </div>

        {/* Grant Role Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Acordă Rol Nou</CardTitle>
                <CardDescription>
                  Adaugă un administrator sau moderator nou
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-[1fr,auto,auto]">
              <div className="space-y-2">
                <Label htmlFor="email">Email Utilizator</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="utilizator@email.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={newUserRole} onValueChange={(v: 'admin' | 'moderator') => setNewUserRole(v)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={grantRole} disabled={granting}>
                  {granting ? 'Se acordă...' : 'Acordă Rol'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Roles List */}
        <Card>
          <CardHeader>
            <CardTitle>Utilizatori cu Roluri</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizator</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Data Acordării</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {profiles[userRole.user_id]?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {profiles[userRole.user_id]?.email || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(userRole.role)}</TableCell>
                      <TableCell>
                        {new Date(userRole.created_at).toLocaleDateString('ro-RO')}
                      </TableCell>
                      <TableCell className="text-right">
                        {profiles[userRole.user_id]?.email !== 'hrelea001@gmail.com' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Această acțiune va revoca rolul de {userRole.role} pentru{' '}
                                  {profiles[userRole.user_id]?.email}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulează</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => revokeRole(userRole.id, profiles[userRole.user_id]?.email)}
                                >
                                  Revocă Rol
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ManageRoles;
