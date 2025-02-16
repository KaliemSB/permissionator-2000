import { IsDefined, IsNotEmpty, IsString, IsUrl } from "class-validator";

export class Credentials {
	@IsString()
	@IsNotEmpty()
	@IsDefined()
	@IsUrl()
	base_url: string;

	@IsString()
	@IsNotEmpty()
	@IsDefined()
	admin_secret: string;

	constructor(credentials: Credentials) {
		Object.assign(this, credentials);
	}
}
