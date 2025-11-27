import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History, User, Calendar } from "lucide-react";
import { format } from "date-fns";

type AuditLog = {
  id: string;
  section_key: string;
  old_content: Record<string, any>;
  new_content: Record<string, any>;
  changed_at: string;
  changed_by: string | null;
};

export default function ContentAudit() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["content-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_content_audit")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const getChangedFields = (oldContent: Record<string, any>, newContent: Record<string, any>) => {
    const changes: Array<{ field: string; old: any; new: any }> = [];
    
    const allKeys = new Set([...Object.keys(oldContent), ...Object.keys(newContent)]);
    
    allKeys.forEach((key) => {
      if (JSON.stringify(oldContent[key]) !== JSON.stringify(newContent[key])) {
        changes.push({
          field: key,
          old: oldContent[key],
          new: newContent[key],
        });
      }
    });

    return changes;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Istoric Modificări Conținut</h2>
          <p className="text-muted-foreground">
            Toate modificările aduse conținutului homepage-ului
          </p>
        </div>

        <div className="space-y-4">
          {logs && logs.length > 0 ? (
            logs.map((log) => {
              const changes = getChangedFields(log.old_content, log.new_content);
              
              return (
                <Card key={log.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <History className="w-5 h-5 text-primary" />
                          Secțiune: {log.section_key}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(log.changed_at), "dd MMM yyyy, HH:mm")}
                          </span>
                          {log.changed_by && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              ID: {log.changed_by.substring(0, 8)}...
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Modificări:</h4>
                      {changes.map((change, idx) => (
                        <div key={idx} className="bg-muted rounded-lg p-3 space-y-2">
                          <div className="font-medium text-sm text-primary">
                            Câmp: {change.field}
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-muted-foreground mb-1">Vechea valoare:</div>
                              <div className="bg-destructive/10 text-destructive p-2 rounded border border-destructive/20">
                                {typeof change.old === "string" 
                                  ? change.old.substring(0, 100) + (change.old.length > 100 ? "..." : "")
                                  : JSON.stringify(change.old)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-1">Noua valoare:</div>
                              <div className="bg-primary/10 text-primary p-2 rounded border border-primary/20">
                                {typeof change.new === "string"
                                  ? change.new.substring(0, 100) + (change.new.length > 100 ? "..." : "")
                                  : JSON.stringify(change.new)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nu există modificări înregistrate</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}