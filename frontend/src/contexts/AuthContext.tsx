import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AuthDao } from "@/common_assets/DataRepository/AuthDao";
import { fetchAndStorePermissions, hasPermission } from "@/components/CLAuth/CLAuth";
import { clearUserPermissions } from "@/common_assets/storage/CPStorage";
import { MODULES } from "@/common_assets/Constants/modules";
import { CPPermissions } from "@/common_assets/Constants/permissions";
import type { PermissionDict, RegisterPayload, User } from "@/types";

interface AuthContextValue {
  user: User | null | undefined;
  permissions: PermissionDict;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
  setUser: React.Dispatch<React.SetStateAction<User | null | undefined>>;
  canAccessAdmin: () => boolean;
  hasPermission: (mod: string, op: number) => boolean;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [permissions, setPermissions] = useState<PermissionDict>({});

  const refresh = async (): Promise<User | null> => {
    try {
      const data = (await AuthDao.me()) as User;
      setUser(data);
      try {
        const perms = await fetchAndStorePermissions();
        setPermissions(perms);
      } catch {
        setPermissions({});
      }
      return data;
    } catch {
      setUser(null);
      setPermissions({});
      clearUserPermissions();
      return null;
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = (await AuthDao.login(email, password)) as User;
    setUser(data);
    const perms = await fetchAndStorePermissions();
    setPermissions(perms);
    return data;
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const data = (await AuthDao.register(payload)) as User;
    setUser(data);
    const perms = await fetchAndStorePermissions();
    setPermissions(perms);
    return data;
  };

  const logout = async (): Promise<void> => {
    try {
      await AuthDao.logout();
    } catch {
      /* session may already be cleared */
    }
    setUser(null);
    setPermissions({});
    clearUserPermissions();
  };

  const canAccessAdmin = (): boolean => {
    if (!user) return false;
    if (["admin", "staff"].includes(user.role)) return true;
    return hasPermission(MODULES.DASHBOARD, CPPermissions.READ, permissions);
  };

  const value: AuthContextValue = {
    user,
    permissions,
    login,
    register,
    logout,
    refresh,
    setUser,
    canAccessAdmin,
    hasPermission: (mod, op) => hasPermission(mod, op, permissions),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
