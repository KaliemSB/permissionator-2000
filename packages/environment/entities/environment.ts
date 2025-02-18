import { Credentials } from "entities";
import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsObject, IsString, ValidateNested } from "class-validator";

export class Environment {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsNotEmpty()
	@IsDefined()
	@IsObject()
	@ValidateNested()
	@Type(() => Credentials)
	credentials: Credentials;

	constructor(environment: Environment) {
		Object.assign(this, environment);
	}
}
