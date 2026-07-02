/** Products domain DAO. */
import xhr, { unwrapResponse } from "./core/WebApiCaller/xhr";
import { ApiUrl } from "../URL/ApiUrl";
import { MODULES } from "../Constants/modules";
import type { Product } from "@/types";

export interface ProductListParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export const ProductsDao = {
  async list(params: ProductListParams = {}): Promise<Product[]> {
    const { data } = await xhr.get(ApiUrl.PRODUCTS, { params, headers: { moduleID: MODULES.CATALOG } });
    return unwrapResponse<Product[]>(data);
  },
  async getBySlug(slug: string): Promise<Product> {
    const { data } = await xhr.get(`${ApiUrl.PRODUCTS}/${slug}`, { headers: { moduleID: MODULES.CATALOG } });
    return unwrapResponse<Product>(data);
  },
  async create(payload: Partial<Product>): Promise<Product> {
    const { data } = await xhr.post(ApiUrl.PRODUCTS, payload, { headers: { moduleID: MODULES.PRODUCTS } });
    return unwrapResponse<Product>(data);
  },
  async update(id: string, payload: Partial<Product>): Promise<Product> {
    const { data } = await xhr.patch(`${ApiUrl.PRODUCTS}/${id}`, payload, {
      headers: { moduleID: MODULES.PRODUCTS },
    });
    return unwrapResponse<Product>(data);
  },
  async remove(id: string): Promise<unknown> {
    const { data } = await xhr.delete(`${ApiUrl.PRODUCTS}/${id}`, { headers: { moduleID: MODULES.PRODUCTS } });
    return unwrapResponse(data);
  },
  async listCategories(): Promise<unknown> {
    const { data } = await xhr.get(ApiUrl.CATEGORIES, { headers: { moduleID: MODULES.CATALOG } });
    return unwrapResponse(data);
  },
};
