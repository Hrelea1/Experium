import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Eye, EyeOff, MapPin } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Experience {
  id: string;
  title: string;
  location_name: string;
  price: number;
  is_active: boolean;
  is_featured: boolean;
  avg_rating: number;
  total_reviews: number;
  categories?: {
    name: string;
  };
}

const ManageExperiences = () => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setExperiences(data || []);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu am putut încărca experiențele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('experiences')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: `Experiența a fost ${!currentStatus ? 'activată' : 'dezactivată'}`,
      });

      fetchExperiences();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('experiences')
        .update({ is_featured: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: `Experiența ${!currentStatus ? 'este acum' : 'nu mai este'} evidențiată`,
      });

      fetchExperiences();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Experiențe</h2>
            <p className="text-muted-foreground">
              Gestionează toate experiențele disponibile
            </p>
          </div>
          <Button onClick={() => navigate('/admin/experiences/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Experiență
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista Experiențe ({experiences.length})</CardTitle>
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
                    <TableHead>Titlu</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Locație</TableHead>
                    <TableHead>Preț</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experiences.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium">{exp.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {exp.categories?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {exp.location_name}
                        </div>
                      </TableCell>
                      <TableCell>{exp.price} RON</TableCell>
                      <TableCell>
                        {exp.avg_rating?.toFixed(1) || 'N/A'} ({exp.total_reviews})
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant={exp.is_active ? 'default' : 'secondary'}>
                            {exp.is_active ? 'Activ' : 'Inactiv'}
                          </Badge>
                          {exp.is_featured && (
                            <Badge variant="outline">Evidențiat</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(exp.id, exp.is_active)}
                          >
                            {exp.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          {exp.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/experiences/${exp.id}/edit`)}
                              aria-label="Editează experiența"
                              title="Editează"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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

export default ManageExperiences;
