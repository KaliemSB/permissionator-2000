import { isCancel, text } from "@clack/prompts";
import envPaths from "env-paths";
import { errAsync, ResultAsync } from "neverthrow";
import { mkdir } from "node:fs/promises";

class Credentials {
  base_url: string;
  admin_secret: string;

  constructor(credentials: Credentials) {
    Object.assign(this, credentials);
  }
}

class Enviroment {
  name: string;
  credentials: Credentials;

  constructor(enviroment: Enviroment) {
    Object.assign(this, enviroment);
  }
}

const urlPattern = new RegExp(
  "(?:https?)://(w+:?w*)?(S+)(:d+)?(/|/([w#!:.?+=&%!-/]))?"
);

const configPath = envPaths("permissionator-2000", {
  suffix: "",
}).config;
const configFileName = "config.json";
const configFilePath = `${configPath}/${configFileName}`;

const getConfigFile = async () => {
  await mkdir(configPath, {
    recursive: true,
  });

  let configJson = await ResultAsync.fromThrowable<
    [],
    Array<Enviroment>,
    Error
  >(() => Bun.file(configFilePath).json())();

  if (configJson.isErr()) {
    await Bun.write(configFilePath, JSON.stringify([]));

    return [] as Array<Enviroment>;
  }

  return configJson.value;
};

export let selectedEnviroment: Enviroment;

export const credentialsHandler = async (enviromentName: string) => {
  const getConfigFileResult = await ResultAsync.fromThrowable(() =>
    getConfigFile()
  )();

  if (getConfigFileResult.isErr()) {
    return errAsync(new Error("Error getting or creating the config file."));
  }

  const enviromentsArray = getConfigFileResult.value;
  let isSelectedEnviromentFound = enviromentsArray.find(
    (item) => item.name === enviromentName
  );

  if (!isSelectedEnviromentFound) {
    const base_url = await text({
      message: "Hasura base url?",
      placeholder: "https://xxx.hasura.sa-east-1.nhost.run",
      validate(value) {
        if (value.length === 0) return `Value is required!`;
        if (urlPattern.test(value)) return `Value needs to be a url!`;
      },
    });

    if (isCancel(base_url)) {
      process.exit(0);
    }

    const admin_secret = await text({
      message: "Hasura admin secret?",
    });

    if (isCancel(admin_secret)) {
      process.exit(0);
    }

    selectedEnviroment = new Enviroment({
      name: enviromentName,
      credentials: {
        admin_secret: admin_secret,
        base_url: base_url,
      },
    });

    enviromentsArray.push(selectedEnviroment);
  } else {
    selectedEnviroment = isSelectedEnviromentFound;
  }

  Bun.write(configFilePath, JSON.stringify(enviromentsArray, null, 2));
};
