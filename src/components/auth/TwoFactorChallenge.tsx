import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorChallengeProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TwoFactorChallenge({ onSuccess, onCancel }: TwoFactorChallengeProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast({
        title: 'Eroare',
        description: 'Codul trebuie să aibă 6 cifre',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Get the list of factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === 'verified');

      if (!totpFactor) {
        throw new Error('2FA not configured');
      }

      // Verify the code
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code: code,
      });

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Autentificare reușită',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Cod invalid',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verificare în doi pași
        </CardTitle>
        <CardDescription>
          Introdu codul din aplicația ta de autentificare
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="2fa-code">Cod de verificare</Label>
            <Input
              id="2fa-code"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required
            />
            <p className="text-sm text-muted-foreground">
              Introdu codul de 6 cifre din aplicația ta
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isVerifying} className="flex-1">
              {isVerifying ? 'Se verifică...' : 'Verifică'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Anulează
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
