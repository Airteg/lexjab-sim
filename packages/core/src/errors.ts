export type CoreErrorCode =
  | 'EMPTY_DECK'
  | 'DUPLICATE_ITEM'
  | 'INVALID_UNITS_PER_LESSON'
  | 'INVALID_GRADE'
  | 'ITEM_NOT_IN_LESSON'
  | 'ALREADY_GRADED';

export class CoreError extends Error {
  readonly code: CoreErrorCode;

  constructor(code: CoreErrorCode, message: string) {
    super(message);
    this.name = 'CoreError';
    this.code = code;
  }
}
