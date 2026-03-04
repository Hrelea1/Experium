import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationSettings() {
  const { isSubscribed, isSupported, permission, subscribe, unsubscribe } = usePushSubscription();
  const { toast } = useToast();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast({ title: 'Notificări dezactivate', description: 'Nu vei mai primi notificări push.' });
    } else {
      const success = await subscribe();
      if (success) {
        toast({ title: 'Notificări activate!', description: 'Vei primi notificări push pentru rezervări noi.' });
      } else if (permission === 'denied') {
        toast({ title: 'Permisiune refuzată', description: 'Activează notificările din setările browser-ului.', variant: 'destructive' });
      } else {
        toast({ title: 'Eroare', description: 'Nu am putut activa notificările push.', variant: 'destructive' });
      }
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BellOff className="h-5 w-5" />
            <p className="text-sm">Browser-ul tău nu suportă notificări push.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Notificări Push
        </CardTitle>
        <CardDescription>
          Primește notificări în browser când ai rezervări noi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="push-toggle" className="flex flex-col gap-1">
            <span>Notificări browser</span>
            <span className="text-xs text-muted-foreground font-normal">
              {isSubscribed ? 'Activ - vei primi notificări' : 'Inactiv - activează pentru alerte instant'}
            </span>
          </Label>
          <Switch
            id="push-toggle"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
          />
        </div>
        {permission === 'denied' && (
          <p className="text-xs text-destructive mt-3">
            Notificările sunt blocate. Modifică setarea din browser → Setări Site → Notificări.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
