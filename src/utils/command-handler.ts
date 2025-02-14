import { intro } from "@clack/prompts";
import { bgRedBright } from "picocolors";
import { credentialsHandler } from "./credentials-handler";

export const commandHandler = async (
  fn: () => void | Promise<void>,
  options?: {
    needCredentials?: {
      enviroment: string;
    };
  }
) => {
  intro(bgRedBright(" Permissionator-2000 "));
  if (options?.needCredentials?.enviroment) {
    await credentialsHandler(options.needCredentials.enviroment);
    fn();
    return;
  }

  fn();
  return;
};
