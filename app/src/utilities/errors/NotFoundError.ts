import AppError from "./AppError";

class NotFoundError extends AppError {
    private constructor(message: string) {
        super(NotFoundError.name, 404, message);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }

    static throwIf(condition: boolean, message: string): void {
        if (condition) {
            throw new NotFoundError(message);
        }
    }
}

export default NotFoundError;
