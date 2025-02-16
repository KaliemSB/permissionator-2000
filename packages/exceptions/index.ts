export class UNEXPECTED_ERROR_EXCEPTION extends Error {
	constructor() {
		super("An unexpected error occurred");
	}
}

export class NOT_FOUND_EXCEPTION extends Error {
	constructor(message: string) {
		super(`${message} not found`);
	}
}

export class ALREADY_EXISTS_EXCEPTION extends Error {
	constructor(message: string) {
		super(`${message} already exists`);
	}
}

export class VALIDATION_ERROR_EXCEPTION extends Error {
	constructor(message: string) {
		super(message);
	}
}
