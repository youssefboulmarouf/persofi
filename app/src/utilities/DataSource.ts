import BadRequestError from "./errors/BadRequestError";

/** Where data being parsed came from: a client request, or a row already in the database. */
export type DataSource = "request" | "stored";

export type RejectData = (message: string, field?: string) => never;

/**
 * Rejects malformed data according to its source. A bad request is the client's fault (400 with
 * the field); a bad stored row is a server-side integrity problem (plain error → 500).
 */
export function invalidData(source: DataSource): RejectData {
    return (message, field) => {
        if (source === "stored") {
            throw new Error(`Invalid stored ${field ?? "data"}: ${message}`);
        }
        return BadRequestError.reject(message, field);
    };
}
