import AppError from "./AppError";

export enum PostingErrorCode {
    ACCOUNT_REQUIRED = "ACCOUNT_REQUIRED",
    ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND",
    ACCOUNT_TYPE_NOT_ALLOWED = "ACCOUNT_TYPE_NOT_ALLOWED",
    SAME_ACCOUNT = "SAME_ACCOUNT",
    BALANCE_NOT_INITIALIZED = "BALANCE_NOT_INITIALIZED",
    BALANCE_ALREADY_INITIALIZED = "BALANCE_ALREADY_INITIALIZED",
    UNSUPPORTED_TRANSACTION_TYPE = "UNSUPPORTED_TRANSACTION_TYPE",
}

/**
 * A transaction breaks a rule of the posting matrix (docs/POSTING_MATRIX.md).
 * Callers branch on `code`, never on the message text.
 */
class PostingRuleError extends AppError {
    public readonly code: PostingErrorCode;

    constructor(code: PostingErrorCode, message: string) {
        super(PostingRuleError.name, 400, message);
        this.code = code;
        Object.setPrototypeOf(this, PostingRuleError.prototype);
    }
}

export default PostingRuleError;
