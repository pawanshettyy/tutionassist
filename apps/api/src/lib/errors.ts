export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const notFound = (what: string) => new AppError(404, "NOT_FOUND", `${what} not found`);
export const forbidden = (msg = "Forbidden") => new AppError(403, "FORBIDDEN", msg);
export const badRequest = (msg: string) => new AppError(400, "BAD_REQUEST", msg);
