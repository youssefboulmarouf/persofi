import AppError from "./AppError";

export enum PostingErrorCode {
    ACCOUNT_REQUIRED = "ACCOUNT_REQUIRED",
    ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND",
    ACCOUNT_TYPE_NOT_ALLOWED = "ACCOUNT_TYPE_NOT_ALLOWED",
    SAME_ACCOUNT = "SAME_ACCOUNT",
    BALANCE_NOT_INITIALIZED = "BALANCE_NOT_INITIALIZED",
    BALANCE_ALREADY_INITIALIZED = "BALANCE_ALREADY_INITIALIZED",
    BACKDATED_TRANSACTION = "BACKDATED_TRANSACTION",
    UNSUPPORTED_TRANSACTION_TYPE = "UNSUPPORTED_TRANSACTION_TYPE",
    REFUND_ORIGINAL_REQUIRED = "REFUND_ORIGINAL_REQUIRED",
    REFUND_ORIGINAL_NOT_EXPENSE = "REFUND_ORIGINAL_NOT_EXPENSE",
    REFUND_ORIGINAL_NOT_PROCESSED = "REFUND_ORIGINAL_NOT_PROCESSED",
    REFUND_ACCOUNT_MISMATCH = "REFUND_ACCOUNT_MISMATCH",
    REFUND_EXCEEDS_REMAINING = "REFUND_EXCEEDS_REMAINING",
}

/**
 * A transaction breaks a rule of the posting matrix (docs/POSTING_MATRIX.md).
 * Callers branch on `code`, never on the message text.
 */
class PostingRuleError extends AppError {
    public readonly code: PostingErrorCode;

    constructor(code: PostingErrorCode, message: string, status = 400, field?: string) {
        super(PostingRuleError.name, status, message, field, code);
        this.code = code;
        Object.setPrototypeOf(this, PostingRuleError.prototype);
    }
}

export default PostingRuleError;
