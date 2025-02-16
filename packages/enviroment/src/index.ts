import "reflect-metadata";
import { Enviroment } from "@/entities";
import {
	ALREADY_EXISTS_EXCEPTION,
	NOT_FOUND_EXCEPTION,
	UNEXPECTED_ERROR_EXCEPTION,
} from "@permissionator-2000/exceptions";
import { safeValidate } from "@permissionator-2000/utils";
import { plainToInstance } from "class-transformer";
import envPaths from "env-paths";
import { err, fromAsyncThrowable, ok } from "neverthrow";
import { mkdir, readdir } from "node:fs/promises";

export class EnviromentManager {
	configPath = envPaths("permissionator-2000", {
		suffix: "",
	}).config;

	private createConfigFolder() {
		const safeMkdir = fromAsyncThrowable<[string], void, Error>(mkdir);

		return safeMkdir(this.configPath)
			.mapErr((err) => {
				if (!("code" in err)) return new UNEXPECTED_ERROR_EXCEPTION();
				if (err.code === "EEXIST") return new ALREADY_EXISTS_EXCEPTION("Directory");
				return new UNEXPECTED_ERROR_EXCEPTION();
			})
			.map(() => true);
	}

	async getConfigFolderEnviromentFiles() {
		const safeReaddir = fromAsyncThrowable<[string], Array<string>, Error>(readdir);

		const result = await safeReaddir(this.configPath).mapErr((err) => {
			if (!("code" in err)) return new UNEXPECTED_ERROR_EXCEPTION();
			if (err.code === "ENOENT") return new NOT_FOUND_EXCEPTION("Directory");
			return new UNEXPECTED_ERROR_EXCEPTION();
		});

		return result.match(
			(files) => ok(files.filter((file) => file.endsWith(".json"))),
			(error) => {
				if (error instanceof NOT_FOUND_EXCEPTION) {
					this.createConfigFolder();
					return ok(<Array<string>>[]);
				}

				return err(error);
			},
		);
	}

	private readFileWithConfigPath(fileName: string) {
		return Bun.file(`${this.configPath}/${fileName}`).json();
	}

	private writeFileWithConfigPath(fileName: string, data: string) {
		return Bun.file(`${this.configPath}/${fileName}`).write(data);
	}

	async getAllEnviroments() {
		const configFiles = await this.getConfigFolderEnviromentFiles();

		if (configFiles.isErr()) {
			console.error(configFiles.error.message);
			process.exit(1);
		}

		const enviroments: Array<Enviroment> = [];

		for (const file of configFiles.value) {
			const fileData: object = await this.readFileWithConfigPath(file);
			enviroments.push(plainToInstance(Enviroment, fileData));
		}

		return enviroments;
	}

	async getEnviroment(name: string) {
		const enviroments = await this.getAllEnviroments();

		const enviroment = enviroments.find((env) => env.name === name);

		if (!enviroment) {
			console.error(new NOT_FOUND_EXCEPTION("Enviroment").message);
			process.exit(1);
		}

		const validateResult = await safeValidate(enviroment);

		if (validateResult.isErr()) {
			console.error("Enviroment is invalid");
			process.exit(1);
		}

		return enviroment;
	}

	async createEnviroment(param: Enviroment) {
		const enviroments = await this.getAllEnviroments();

		if (enviroments.find((env) => env.name === param.name)) {
			console.error(new ALREADY_EXISTS_EXCEPTION("Enviroment").message);
			process.exit(1);
		}

		const newEnviroment = plainToInstance(Enviroment, param);

		const validateResult = await safeValidate(newEnviroment);

		if (validateResult.isErr()) {
			console.error(validateResult.error.message);
			process.exit(1);
		}

		await this.writeFileWithConfigPath(`${param.name}.json`, JSON.stringify(newEnviroment));

		return newEnviroment;
	}

	async deleteEnviroment(name: string) {
		const enviroments = await this.getAllEnviroments();

		const enviroment = enviroments.find((env) => env.name === name);

		if (!enviroment) {
			console.error(new NOT_FOUND_EXCEPTION("Enviroment").message);
			process.exit(1);
		}

		await Bun.file(`${this.configPath}/${name}.json`).delete();
	}
}
