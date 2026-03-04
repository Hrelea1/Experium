CREATE OR REPLACE FUNCTION public.get_ambassador_stats(ambassador_user_id uuid)
 RETURNS TABLE(active_experiences_count bigint, total_revenue numeric, total_sales bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.id) as active_experiences_count,
        COALESCE(SUM(b.total_price), 0) as total_revenue,
        COUNT(b.id) as total_sales
    FROM public.experiences e
    LEFT JOIN public.bookings b ON b.experience_id = e.id AND b.status IN ('confirmed', 'completed')
    WHERE e.ambassador_id = ambassador_user_id
    AND e.is_active = true;
END;
$function$;