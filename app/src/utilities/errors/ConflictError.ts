import AppError from "./AppError";

class ConflictError extends AppError {
    private constructor(message: string, code?: string) {
        super(ConflictError.name, 409, message, undefined, code);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }

    static throwIf(condition: boolean, message: string, code?: string): void {
        if (condition) throw new ConflictError(message, code);
    }
}

export default ConflictError;
