import AppError from "./AppError";

class BadRequestError extends AppError {
    private constructor(message: string) {
        super(BadRequestError.name, 400, message);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }

    static throwIf(condition: boolean, message: string): void {
        if (condition) {
            throw new BadRequestError(message);
        }
    }
}

export default BadRequestError;