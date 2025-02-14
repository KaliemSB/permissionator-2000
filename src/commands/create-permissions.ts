import { client } from "@/http";
import color from "picocolors";
import * as p from "@clack/prompts";

export const createPermissions = async () => {
  const {
    data: { result: schemaResult },
  } = await client.post<{ result: string[][] }>("/v2/query", {
    type: "run_sql",
    args: {
      source: "default",
      sql: "SELECT schema_name FROM information_schema.schemata WHERE\nschema_name NOT IN ('information_schema', 'hdb_catalog', 'hdb_views', '_timescaledb_internal') AND schema_name NOT LIKE 'pg\\_%'\n\nORDER BY schema_name ASC;",
      cascade: false,
      read_only: true,
    },
  });

  p.intro(`${color.bgRedBright(" Permissionator 2000 ")}`);

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
  } = await client.post<{ result: string[][] }>("/v2/query", {
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
  } = await client.post<{ result: string[][] }>("/v2/query", {
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
    options: [
      {
        label: "Select all",
        value: "select all",
      },
      ...allColumns.map((item) => ({
        value: item,
      })),
    ],
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

  const allRoles = await client
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
    options: [
      {
        label: "Select all",
        value: "select all",
      },
      ...allRoles.map((item) => ({
        value: item,
        label: item,
      })),
    ],
  });

  const {
    data: { metadata },
  } = await client.post("/v1/metadata", {
    type: "export_metadata",
    version: 2,
    args: {},
  });

  const index = metadata.sources[0].tables.findIndex(
    (item: { table: { name: string } }) =>
      item.table.name === tableOption.toString()
  );

  const rolesArray = (
    (roleOption as string[]).includes("select all") ? allRoles : colmunsOptions
  ) as Array<string>;

  const permsArray = rolesArray.map((item) => ({
    role: item,
    permission: {
      columns: (colmunsOptions as Array<string>).includes("select all")
        ? allColumns
        : colmunsOptions,
      filter: {},
    },
    comment: "",
  }));

  const newMetadata = metadata;

  newMetadata.sources[0].tables[index][permTypeOption.toString()] = permsArray;

  Bun.write("out.json", JSON.stringify(newMetadata, null, 2));
};
