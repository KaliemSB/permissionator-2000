import { selectedEnviroment } from "@/utils";
import xior from "xior";

export const getHttpClient = () =>
  xior.create({
    baseURL: selectedEnviroment.credentials.base_url,
    headers: {
      "x-hasura-admin-secret": selectedEnviroment.credentials.admin_secret,
    },
  });
