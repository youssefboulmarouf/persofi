class AppError extends Error {
    public status: number;
    public readonly field?: string;
    public readonly code: string;

    constructor(name: string, status: number, message: string, field?: string, code?: string) {
        super(message);
        this.name = name;
        this.status = status;
        this.field = field;
        this.code =
            code ??
            (status === 400
                ? "VALIDATION_ERROR"
                : status === 404
                  ? "NOT_FOUND"
                  : status === 409
                    ? "STATE_CONFLICT"
                    : "APPLICATION_ERROR");

        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export default AppError;
