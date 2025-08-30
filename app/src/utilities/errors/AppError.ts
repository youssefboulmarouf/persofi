class AppError extends Error {
    public status: number;

    constructor(name: string, status: number, message: string) {
        super(message);
        this.name = name;
        this.status = status;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export default AppError;
