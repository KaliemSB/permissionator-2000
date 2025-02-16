import { Credentials } from "@/entities";
import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsObject, IsString, ValidateNested } from "class-validator";

export class Enviroment {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsNotEmpty()
	@IsDefined()
	@IsObject()
	@ValidateNested()
	@Type(() => Credentials)
	credentials: Credentials;

	constructor(enviroment: Enviroment) {
		Object.assign(this, enviroment);
	}
}
