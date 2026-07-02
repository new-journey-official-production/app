/** RBAC domain DAO. */
import xhr, { unwrapResponse } from "./core/WebApiCaller/xhr";
import { ApiUrl } from "../URL/ApiUrl";
import { MODULES } from "../Constants/modules";
import type {
  PermissionMatrixItem,
  PermissionDict,
  RbacModule,
  RbacRole,
  User,
  UserPermissionsPayload,
} from "@/types";

export const RbacDao = {
  async getMyPermissions(): Promise<PermissionDict> {
    const { data } = await xhr.get(ApiUrl.RBAC.MY_PERMISSIONS, { headers: { moduleID: MODULES.ACCOUNT } });
    return unwrapResponse<PermissionDict>(data);
  },

  async listUsers(): Promise<User[]> {
    const { data } = await xhr.get(ApiUrl.RBAC.USERS, { headers: { moduleID: MODULES.USERS } });
    return unwrapResponse<User[]>(data);
  },

  async getUserPermissions(uuid: string): Promise<UserPermissionsPayload> {
    const { data } = await xhr.get(ApiUrl.RBAC.USER_PERMISSIONS, {
      params: { uuid },
      headers: { moduleID: MODULES.USERS },
    });
    return unwrapResponse<UserPermissionsPayload>(data);
  },

  async updateUserPermissions(uuid: string, permissions: PermissionMatrixItem[]): Promise<PermissionDict> {
    const { data } = await xhr.put(
      ApiUrl.RBAC.USER_PERMISSIONS,
      { permissions },
      {
        params: { uuid },
        headers: { moduleID: MODULES.USERS },
      },
    );
    return unwrapResponse<PermissionDict>(data);
  },

  async listModules(): Promise<RbacModule[]> {
    const { data } = await xhr.get(ApiUrl.RBAC.MODULES, { headers: { moduleID: MODULES.ROLES } });
    return unwrapResponse<RbacModule[]>(data);
  },

  async listRoles(): Promise<RbacRole[]> {
    const { data } = await xhr.get(ApiUrl.RBAC.ROLES, { headers: { moduleID: MODULES.ROLES } });
    return unwrapResponse<RbacRole[]>(data);
  },

  async getRole(roleId: string): Promise<RbacRole> {
    const { data } = await xhr.get(`${ApiUrl.RBAC.ROLES}${roleId}`, { headers: { moduleID: MODULES.ROLES } });
    return unwrapResponse<RbacRole>(data);
  },

  async createRole(payload: { name: string; description?: string }): Promise<RbacRole> {
    const { data } = await xhr.post(ApiUrl.RBAC.ROLES, payload, { headers: { moduleID: MODULES.ROLES } });
    return unwrapResponse<RbacRole>(data);
  },

  async updateRole(roleId: string, payload: Record<string, unknown>): Promise<RbacRole> {
    const { data } = await xhr.patch(`${ApiUrl.RBAC.ROLES}${roleId}`, payload, { headers: { moduleID: MODULES.ROLES } });
    return unwrapResponse<RbacRole>(data);
  },

  async deleteRole(roleId: string): Promise<unknown> {
    const { data } = await xhr.delete(`${ApiUrl.RBAC.ROLES}${roleId}`, { headers: { moduleID: MODULES.ROLES } });
    return unwrapResponse(data);
  },

  async updateRolePermissions(roleId: string, permissions: PermissionMatrixItem[]): Promise<Record<string, number>> {
    const { data } = await xhr.put(`${ApiUrl.RBAC.ROLES}${roleId}/permissions`, { permissions }, {
      headers: { moduleID: MODULES.ROLES },
    });
    return unwrapResponse<Record<string, number>>(data);
  },

  async reloadPermissions(): Promise<unknown> {
    const { data } = await xhr.post(ApiUrl.RBAC.RELOAD);
    return unwrapResponse(data);
  },
};
