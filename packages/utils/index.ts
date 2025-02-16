import { UNEXPECTED_ERROR_EXCEPTION, VALIDATION_ERROR_EXCEPTION } from "@permissionator-2000/exceptions";
import { validateOrReject, ValidationError } from "class-validator";
import { fromAsyncThrowable } from "neverthrow";

export function getAllConstraints(errors: ValidationError[]): string[] {
	const constraints: string[] = [];

	for (const error of errors) {
		if (error.constraints) {
			const constraintValues = Object.values(error.constraints);
			constraints.push(...constraintValues);
		}

		if (error.children) {
			const childConstraints = getAllConstraints(error.children);
			constraints.push(...childConstraints);
		}
	}

	return constraints;
}

export const safeValidate = fromAsyncThrowable<[object], void, VALIDATION_ERROR_EXCEPTION | UNEXPECTED_ERROR_EXCEPTION>(
	validateOrReject,
	(err) => {
		if (Array.isArray(err)) {
			if (err.at(0) instanceof ValidationError) {
				return new VALIDATION_ERROR_EXCEPTION(getAllConstraints(err).join("\n"));
			}
		}

		return new UNEXPECTED_ERROR_EXCEPTION();
	},
);
