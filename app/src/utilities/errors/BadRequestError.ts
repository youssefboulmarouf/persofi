import AppError from "./AppError";

class BadRequestError extends AppError {
    private constructor(message: string, field?: string) {
        super(BadRequestError.name, 400, message, field);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }

    static throwIf(condition: boolean, message: string, field?: string): void {
        if (condition) {
            throw new BadRequestError(message, field);
        }
    }

    static reject(message: string, field?: string): never {
        throw new BadRequestError(message, field);
    }
}

export default BadRequestError;
