/** Auth domain DAO. */
import xhr, { unwrapResponse } from "./core/WebApiCaller/xhr";
import { ApiUrl } from "../URL/ApiUrl";
import { MODULES } from "../Constants/modules";
import type { RegisterPayload, User } from "@/types";

const MODULE = MODULES.ACCOUNT;

export const AuthDao = {
  async me(): Promise<User> {
    const { data } = await xhr.get(ApiUrl.AUTH.ME, { headers: { moduleID: MODULE } });
    return unwrapResponse<User>(data);
  },
  async login(email: string, password: string): Promise<User> {
    const { data } = await xhr.post(ApiUrl.AUTH.LOGIN, { email, password });
    return unwrapResponse<User>(data);
  },
  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await xhr.post(ApiUrl.AUTH.REGISTER, payload);
    return unwrapResponse<User>(data);
  },
  async logout(): Promise<unknown> {
    const { data } = await xhr.post(ApiUrl.AUTH.LOGOUT);
    return unwrapResponse(data);
  },
  async refresh(): Promise<unknown> {
    const { data } = await xhr.post(ApiUrl.AUTH.REFRESH);
    return unwrapResponse(data);
  },
  async updateProfile(payload: Partial<User>): Promise<User> {
    const { data } = await xhr.patch(ApiUrl.AUTH.PROFILE, payload, {
      headers: { moduleID: MODULES.ACCOUNT_PROFILE },
    });
    return unwrapResponse<User>(data);
  },
  async forgotPassword(email: string): Promise<unknown> {
    const { data } = await xhr.post(ApiUrl.AUTH.FORGOT, { email });
    return unwrapResponse(data);
  },
  async resetPassword(token: string, password: string): Promise<unknown> {
    const { data } = await xhr.post(ApiUrl.AUTH.RESET, { token, password });
    return unwrapResponse(data);
  },
};
