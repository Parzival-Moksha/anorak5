export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static create(message: string): DatabaseError {
    return new DatabaseError(message);
  }
}

export const createDatabaseError = (message: string): DatabaseError => {
  return new DatabaseError(message);
}; 