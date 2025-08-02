// Base API Error Class
export class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 * Use when the client sends invalid data or parameters.
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request: The data provided is invalid or incomplete') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized
 * Use when authentication fails (invalid/missing token).
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized: Authentication is required or has failed') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 * Use when the user is authenticated but lacks required permissions.
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden: You do not have permission to perform this action') {
    super(message, 403);
  }
}

/**
 * 404 Not Found
 * Use when a requested resource does not exist.
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Not Found: The requested resource could not be found') {
    super(message, 404);
  }
}

/**
 * 409 Conflict
 * Use when a request conflicts with the current state (e.g., duplicate entry).
 */
export class ConflictError extends ApiError {
  constructor(message = 'Conflict: The request could not be completed due to a conflict') {
    super(message, 409);
  }
}

/**
 * 500 Internal Server Error
 * Use for unexpected server-side issues.
 */
export class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error: Something went wrong on the server') {
    super(message, 500);
  }
}

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(`[${err.name}] ${err.message}`);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      type: err.name,
      message: err.message
    }
  });
};
