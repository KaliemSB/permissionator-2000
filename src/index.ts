import { Command } from "commander";
import { createPermissions } from "@/commands";

console.clear();

const program = new Command();

program
  .name("permissionator-2000")
  .description("CLI with helpers to use with Hasura")
  .version("1.0.0");

program
  .command("create-permission")
  .aliases(["perm", "crp"])
  .action(() => {
    return createPermissions();
  });

program.parse();
