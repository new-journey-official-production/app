import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RbacDao } from "@/common_assets/DataRepository/RbacDao";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RolesPanel from "./permissions/RolesPanel";
import UserPermissionsPanel from "./permissions/UserPermissionsPanel";
import type { RbacModule } from "@/types";

/** Admin permissions hub — roles and per-user overrides. */
export default function AdminPermissions() {
  const location = useLocation();
  const navigate = useNavigate();
  const [modules, setModules] = useState<RbacModule[]>([]);
  const [loading, setLoading] = useState(true);
  const tab = location.pathname.includes("/users") ? "users" : "roles";

  useEffect(() => {
    RbacDao.listModules()
      .then(setModules)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load modules"))
      .finally(() => setLoading(false));
  }, []);

  const onTabChange = (value: string) => {
    navigate(value === "users" ? "/admin/users" : "/admin/permissions", { replace: true });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Permissions</h1>
          <p className="text-sm text-muted-foreground">Manage roles and user-level access overrides</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-12">Loading permission modules…</div>
      ) : (
        <Tabs value={tab} onValueChange={onTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="users">User overrides</TabsTrigger>
          </TabsList>
          <TabsContent value="roles" className="mt-6">
            <RolesPanel modules={modules} />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <UserPermissionsPanel modules={modules} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
