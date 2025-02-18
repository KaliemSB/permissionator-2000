import { program } from "@commander-js/extra-typings";
import { EnvironmentManager } from "@permissionator-2000/environment";

const environmentManager = new EnvironmentManager();

program.name("permissionator-2000").description("CLI to some Hasura utilities").version("1.0.0");

program
	.command("environment")
  .alias("env")
	.description("Manage environments")
	.command("delete", "Delete an environment").argument("<name>", "Name of the environment").action((name) => environmentManager.deleteEnvironment(name))

program.parse();
