import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { AlertCircle } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { isAdmin, loading } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificare permisiuni...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acces Interzis</h2>
          <p className="text-muted-foreground">
            Nu ai permisiunile necesare pentru a accesa această pagină.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
