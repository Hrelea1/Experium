import { format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';

interface DateCardProps {
  date: string;
  showTime?: boolean;
  className?: string;
}

export const DateCard = ({ date, showTime = false, className = '' }: DateCardProps) => {
  const { i18n } = useTranslation();
  const dateLocale = i18n.language === 'ro' ? ro : enUS;
  const dateObj = new Date(date);

  return (
    <div className={`flex flex-col items-center justify-center bg-primary/10 rounded-lg p-4 min-w-[100px] border-2 border-primary/20 ${className}`}>
      <div className="text-xs font-medium text-primary uppercase tracking-wide">
        {format(dateObj, 'MMM', { locale: dateLocale })}
      </div>
      <div className="text-3xl font-bold text-primary my-1">
        {format(dateObj, 'd')}
      </div>
      <div className="text-xs font-medium text-muted-foreground">
        {format(dateObj, 'yyyy')}
      </div>
      {showTime && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(dateObj, 'HH:mm')}
        </div>
      )}
    </div>
  );
};
