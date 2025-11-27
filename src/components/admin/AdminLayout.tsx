import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { ProtectedAdminRoute } from "./ProtectedAdminRoute";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <ProtectedAdminRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 border-b flex items-center px-4 bg-card">
              <SidebarTrigger />
              <h1 className="ml-4 font-semibold text-lg">Experium Admin</h1>
            </header>
            <main className="flex-1 p-6 bg-muted/30">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedAdminRoute>
  );
};
