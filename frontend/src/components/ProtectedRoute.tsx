import React, { useEffect, useRef, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  admin?: boolean;
}

export default function ProtectedRoute({ children, admin = false }: ProtectedRouteProps) {
  const { user, canAccessAdmin } = useAuth();
  const location = useLocation();

  if (user === undefined) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" data-testid="auth-loading">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-orange-500 pulse-dot" />
          <div
            className="h-2 w-2 rounded-full bg-orange-500 pulse-dot"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="h-2 w-2 rounded-full bg-orange-500 pulse-dot"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && !canAccessAdmin()) return <AdminAccessDenied />;
  return children;
}

/** Redirect non-admin users with a clear message instead of a silent bounce to home. */
function AdminAccessDenied() {
  const shown = useRef(false);
  useEffect(() => {
    if (!shown.current) {
      shown.current = true;
      toast.error("Admin access required");
    }
  }, []);
  return <Navigate to="/account" replace />;
}
