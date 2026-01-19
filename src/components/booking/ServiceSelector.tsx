import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Check, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export interface ExperienceService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_required: boolean;
  max_quantity: number;
}

export interface SelectedService {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ServiceSelectorProps {
  experienceId: string;
  onServicesChange: (services: SelectedService[]) => void;
}

export function ServiceSelector({ experienceId, onServicesChange }: ServiceSelectorProps) {
  const { t } = useTranslation();
  const [services, setServices] = useState<ExperienceService[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('experience_services')
        .select('*')
        .eq('experience_id', experienceId)
        .eq('is_active', true)
        .order('display_order');

      if (!error && data) {
        setServices(data);
        // Auto-select required services
        const initialIds: Record<string, number> = {};
        data.forEach(service => {
          if (service.is_required) {
            initialIds[service.id] = 1;
          }
        });
        setSelectedIds(initialIds);
      }
      setLoading(false);
    };

    fetchServices();
  }, [experienceId]);

  // Compute selected services from IDs and services list
  const selectedServices = useMemo(() => {
    return Object.entries(selectedIds)
      .map(([id, quantity]) => {
        const service = services.find(s => s.id === id);
        if (!service) return null;
        return {
          serviceId: service.id,
          name: service.name,
          price: service.price,
          quantity,
        };
      })
      .filter((s): s is SelectedService => s !== null);
  }, [selectedIds, services]);

  // Notify parent whenever selected services change
  useEffect(() => {
    onServicesChange(selectedServices);
  }, [selectedServices, onServicesChange]);

  const toggleService = useCallback((service: ExperienceService) => {
    if (service.is_required) return;

    setSelectedIds(prev => {
      const newIds = { ...prev };
      if (newIds[service.id]) {
        delete newIds[service.id];
      } else {
        newIds[service.id] = 1;
      }
      return newIds;
    });
  }, []);

  const updateQuantity = useCallback((service: ExperienceService, delta: number) => {
    setSelectedIds(prev => {
      const currentQty = prev[service.id];
      if (!currentQty) return prev;

      const newQuantity = Math.max(1, Math.min(service.max_quantity, currentQty + delta));
      return { ...prev, [service.id]: newQuantity };
    });
  }, []);

  const subtotal = selectedServices.reduce(
    (sum, s) => sum + s.price * s.quantity,
    0
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">
          {t('services.title')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('services.subtitle')}
        </p>
      </div>

      <div className="space-y-2">
        {services.map((service) => {
          const isSelected = !!selectedIds[service.id];
          const quantity = selectedIds[service.id] || 1;

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                relative p-4 rounded-xl border-2 transition-all cursor-pointer
                ${isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                }
                ${service.is_required ? 'cursor-not-allowed opacity-80' : ''}
              `}
              onClick={() => toggleService(service)}
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5 flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/50'
                  } ${service.is_required ? 'opacity-60' : ''}`}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {service.name}
                    </span>
                    <span className="text-primary font-semibold whitespace-nowrap">
                      +{service.price} {t('common.lei')}
                    </span>
                  </div>

                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  )}

                  {service.is_required && (
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {t('services.required')}
                    </span>
                  )}

                  {/* Quantity selector for selected services with max_quantity > 1 */}
                  <AnimatePresence>
                    {isSelected && service.max_quantity > 1 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 mt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-sm text-muted-foreground">
                          {t('services.quantity')}:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(service, -1)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(service, 1)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          (max {service.max_quantity})
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {subtotal > 0 && (
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {t('services.subtotal')}
          </span>
          <span className="font-semibold text-foreground">
            +{subtotal} {t('common.lei')}
          </span>
        </div>
      )}
    </div>
  );
}
