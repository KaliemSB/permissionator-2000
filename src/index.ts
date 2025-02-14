import { createPermissions } from "@/commands";
import { Command } from "commander";
import { commandHandler } from "@/utils";

console.clear();

const program = new Command();

program
  .command("create-permission")
  .aliases(["perm", "crp"])
  .argument("<enviroment>", "target enviroment, select or create")
  .action((enviroment) =>
    commandHandler(createPermissions, {
      needCredentials: {
        enviroment,
      },
    })
  );

program
  .name("permissionator-2000")
  .description("CLI with helpers to use with Hasura")
  .version("1.0.0");

program.parse();
