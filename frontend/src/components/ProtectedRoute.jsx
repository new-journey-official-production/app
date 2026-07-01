import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children, admin = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" data-testid="auth-loading">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-orange-500 pulse-dot" />
          <div className="h-2 w-2 rounded-full bg-orange-500 pulse-dot" style={{ animationDelay: "0.2s" }} />
          <div className="h-2 w-2 rounded-full bg-orange-500 pulse-dot" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && !["admin", "staff"].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
