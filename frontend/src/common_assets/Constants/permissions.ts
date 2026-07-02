/** Bitmask permission flags — must match backend CPPermissions. */
export const CPPermissions = {
  DELETE: 1,
  UPDATE: 2,
  READ: 4,
  CREATE: 8,
  HIDDEN: 16,
} as const;

export type PermissionOp = (typeof CPPermissions)[keyof typeof CPPermissions];

export const FULL_CRUD =
  CPPermissions.DELETE |
  CPPermissions.UPDATE |
  CPPermissions.READ |
  CPPermissions.CREATE;
