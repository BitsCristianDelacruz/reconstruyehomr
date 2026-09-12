export class AppError extends Error {
  constructor(public readonly status: number, message: string, public readonly fields?: Record<string, string[]>) { super(message); }
}
export function requireThat(condition: unknown, status: number, message: string): asserts condition {
  if (!condition) throw new AppError(status, message);
}
