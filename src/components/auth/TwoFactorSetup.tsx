import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface TwoFactorSetupProps {
  onSuccess?: () => void;
}

export function TwoFactorSetup({ onSuccess }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data?.totp?.find((f) => f.status === 'verified');
      setIsEnabled(!!totpFactor);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEnrollment = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      if (data) {
        setTotpSecret(data.totp.secret);
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(data.totp.uri);
        setQrCodeUrl(qrCode);
      }
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu s-a putut inițializa 2FA',
        variant: 'destructive',
      });
      setIsEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Eroare',
        description: 'Codul trebuie să aibă 6 cifre',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const totpFactor = factors.data?.totp?.[0];
      if (!totpFactor) throw new Error('Factor TOTP not found');

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code: verificationCode,
      });

      if (error) throw error;

      toast({
        title: 'Succes',
        description: '2FA activat cu succes',
      });

      setIsEnabled(true);
      setQrCodeUrl('');
      setTotpSecret('');
      setVerificationCode('');
      setIsEnrolling(false);
      onSuccess?.();
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

  const disable2FA = async () => {
    setIsLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === 'verified');
      
      if (totpFactor) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: totpFactor.id,
        });

        if (error) throw error;

        toast({
          title: 'Succes',
          description: '2FA dezactivat cu succes',
        });

        setIsEnabled(false);
      }
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu s-a putut dezactiva 2FA',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEnrollment = () => {
    setIsEnrolling(false);
    setQrCodeUrl('');
    setTotpSecret('');
    setVerificationCode('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Se încarcă...</p>
        </CardContent>
      </Card>
    );
  }

  if (isEnrolling && qrCodeUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurare autentificare în doi pași</CardTitle>
          <CardDescription>
            Scanează codul QR cu aplicația ta de autentificare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Folosește o aplicație precum Google Authenticator, Authy sau Microsoft Authenticator
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
          </div>

          <div className="space-y-2">
            <Label>Sau introdu manual această cheie:</Label>
            <div className="p-3 bg-muted rounded-md">
              <code className="text-sm font-mono break-all">{totpSecret}</code>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-code">Cod de verificare</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            />
            <p className="text-sm text-muted-foreground">
              Introdu codul de 6 cifre din aplicație
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={verifyAndEnable} disabled={isVerifying} className="flex-1">
              {isVerifying ? 'Se verifică...' : 'Verifică și activează'}
            </Button>
            <Button variant="outline" onClick={cancelEnrollment}>
              Anulează
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Autentificare în doi pași (2FA)
        </CardTitle>
        <CardDescription>
          Adaugă un nivel suplimentar de securitate contului tău
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <>
            <Alert>
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Autentificarea în doi pași este <strong>activată</strong>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Contul tău este protejat cu autentificare în doi pași. 
              Vei avea nevoie de codul din aplicația ta de autentificare pentru a te conecta.
            </p>
            <Button variant="destructive" onClick={disable2FA} disabled={isLoading}>
              Dezactivează 2FA
            </Button>
          </>
        ) : (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Autentificarea în doi pași nu este activată
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Protejează-ți contul adăugând autentificare în doi pași. 
              Vei avea nevoie de o aplicație de autentificare pe telefonul tău.
            </p>
            <Button onClick={startEnrollment}>
              Activează 2FA
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
