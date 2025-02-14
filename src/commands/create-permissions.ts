import * as p from "@clack/prompts";
import { getHttpClient } from "@/http";

export const createPermissions = async () => {
  const {
    data: { result: schemaResult },
  } = await getHttpClient().post<{ result: string[][] }>("/v2/query", {
    type: "run_sql",
    args: {
      source: "default",
      sql: "SELECT schema_name FROM information_schema.schemata WHERE\nschema_name NOT IN ('information_schema', 'hdb_catalog', 'hdb_views', '_timescaledb_internal') AND schema_name NOT LIKE 'pg\\_%'\n\nORDER BY schema_name ASC;",
      cascade: false,
      read_only: true,
    },
  });

  const schemaOption = await p.select({
    message: "Pick a schema.",
    options: schemaResult
      .flat()
      .slice(1)
      .map((item) => ({
        value: item,
      })),
  });

  const {
    data: { result: tableResult },
  } = await getHttpClient().post<{ result: string[][] }>("/v2/query", {
    type: "run_sql",
    args: {
      source: "default",
      sql: `SELECT distinct table_name FROM information_schema.columns where table_schema = '${schemaOption.toString()}';`,
      cascade: false,
      read_only: true,
    },
  });

  const tableOption = await p.select({
    message: "Pick a table.",
    options: tableResult
      .flat()
      .slice(1)
      .sort()
      .map((item) => ({
        value: item,
      })),
  });

  const {
    data: { result: columnResult },
  } = await getHttpClient().post<{ result: string[][] }>("/v2/query", {
    type: "run_sql",
    args: {
      source: "default",
      sql: `SELECT column_name FROM information_schema.columns WHERE table_schema = '${schemaOption.toString()}' AND table_name = '${tableOption.toString()}';`,
      cascade: false,
      read_only: true,
    },
  });

  const allColumns = columnResult.flat().slice(1);

  const colmunsOptions = await p.multiselect({
    message: "Pick some columns.",
    options: allColumns.map((item) => ({
      value: item,
    })),
  });

  const permTypeOption = await p.select({
    message: "Pick the permission type.",
    options: [
      {
        value: "insert_permissions",
        label: "Insert",
      },
      {
        value: "select_permissions",
        label: "Select",
      },
      {
        value: "update_permissions",
        label: "Update",
      },
      {
        value: "update_permissions",
        label: "Delete",
      },
    ],
  });

  const allRoles = await getHttpClient()
    .post<{ result: string[][] }>("/v2/query", {
      type: "run_sql",
      args: {
        source: "default",
        sql: `SELECT role FROM auth.roles;`,
        cascade: false,
        read_only: true,
      },
    })
    .then((res) => res.data.result.flat().slice(1));

  const roleOption = await p.multiselect({
    message: "Pick some roles.",
    options: allRoles.map((item) => ({
      value: item,
      label: item,
    })),
  });

  const {
    data: { metadata },
  } = await getHttpClient().post("/v1/metadata", {
    type: "export_metadata",
    version: 2,
    args: {},
  });

  const index = metadata.sources[0].tables.findIndex(
    (item: { table: { name: string } }) =>
      item.table.name === tableOption.toString()
  );

  let permsArray = (roleOption as Array<string>).map((item) => ({
    role: item,
    permission: {
      columns: colmunsOptions,
      filter: {},
      ...(permTypeOption.toString() === "update_permissions" && {
        check: {},
      }),
    },
    comment: "",
  }));

  const newMetadata = metadata;

  newMetadata.sources[0].tables[index][permTypeOption.toString()] = permsArray;

  Bun.write("out.json", JSON.stringify(newMetadata, null, 2));
};
