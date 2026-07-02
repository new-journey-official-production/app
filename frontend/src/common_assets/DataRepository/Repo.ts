/** Single entry point for all DAOs (CP Repo pattern). */
import { AuthDao } from "./AuthDao";
import { RbacDao } from "./RbacDao";
import { ProductsDao } from "./ProductsDao";

export const Repo = {
  auth: AuthDao,
  rbac: RbacDao,
  products: ProductsDao,
};

export { AuthDao, RbacDao, ProductsDao };
export { default as xhr, apiError, unwrapResponse, API_BASE } from "./core/WebApiCaller/xhr";
