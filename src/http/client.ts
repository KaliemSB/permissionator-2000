import xior from "xior";

export const client = xior.create({
  baseURL: "",
  headers: {
    "x-hasura-admin-secret": "",
  },
});
