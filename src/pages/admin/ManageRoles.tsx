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
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

const ManageRoles = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'moderator'>('moderator');
  const [granting, setGranting] = useState(false);
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPrimaryAdmin();
  }, [user]);

  useEffect(() => {
    if (isPrimaryAdmin) {
      fetchData();
    }
  }, [isPrimaryAdmin]);

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
    } finally {
      if (!isPrimaryAdmin) setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setAllProfiles(profilesData || []);

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      setUserRoles(rolesData || []);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu am putut încărca datele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = (userId: string): string[] => {
    return userRoles.filter(r => r.user_id === userId).map(r => r.role);
  };

  const grantRole = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Eroare',
        description: 'Selectează un utilizator',
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
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUserId,
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

        setSelectedUserId('');
        fetchData();
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

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut revoca rolul',
        variant: 'destructive',
      });
    }
  };

  const getProfileById = (userId: string): Profile | undefined => {
    return allProfiles.find(p => p.id === userId);
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

        {/* All Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Toți Utilizatorii ({allProfiles.length})</CardTitle>
            <CardDescription>
              Selectează un utilizator pentru a-i acorda un rol
            </CardDescription>
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
                    <TableHead>Nume</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roluri Actuale</TableHead>
                    <TableHead>Înregistrat</TableHead>
                    <TableHead className="text-right">Acordă Rol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProfiles.map((profile) => {
                    const roles = getUserRoles(profile.id);
                    const isPrimary = profile.email === 'hrelea001@gmail.com';
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {profile.email}
                            {isPrimary && (
                              <Badge variant="outline" className="ml-2">Primary</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {roles.length > 0 ? (
                              roles.map(role => (
                                <span key={role}>{getRoleBadge(role)}</span>
                              ))
                            ) : (
                              <Badge variant="outline">User</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(profile.created_at).toLocaleDateString('ro-RO')}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isPrimary && (
                            <div className="flex items-center justify-end gap-2">
                              <Select 
                                value={selectedUserId === profile.id ? newUserRole : ''} 
                                onValueChange={(v: 'admin' | 'moderator') => {
                                  setSelectedUserId(profile.id);
                                  setNewUserRole(v);
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin" disabled={roles.includes('admin')}>
                                    Admin
                                  </SelectItem>
                                  <SelectItem value="moderator" disabled={roles.includes('moderator')}>
                                    Moderator
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  if (selectedUserId === profile.id) {
                                    grantRole();
                                  } else {
                                    setSelectedUserId(profile.id);
                                    toast({
                                      title: 'Selectează un rol',
                                      description: 'Alege mai întâi rolul din dropdown',
                                    });
                                  }
                                }}
                                disabled={granting || selectedUserId !== profile.id}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Users with Roles - Quick Management */}
        {userRoles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Roluri Acordate ({userRoles.length})</CardTitle>
              <CardDescription>
                Gestionează rolurile existente
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  {userRoles.map((userRole) => {
                    const profile = getProfileById(userRole.user_id);
                    const isPrimary = profile?.email === 'hrelea001@gmail.com';
                    return (
                      <TableRow key={userRole.id}>
                        <TableCell className="font-medium">
                          {profile?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {profile?.email || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(userRole.role)}</TableCell>
                        <TableCell>
                          {new Date(userRole.created_at).toLocaleDateString('ro-RO')}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isPrimary && (
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
                                    {profile?.email}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => revokeRole(userRole.id, profile?.email || '')}
                                  >
                                    Revocă Rol
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManageRoles;
