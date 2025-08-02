export class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
        this.statusCode = 403;
    }
}

export class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || 500;
    const response = {
        error: {
            message: err.message,
            type: err.name,
        }
    };

    if (process.env.NODE_ENV === 'development') {
        response.error.stack = err.stack;
    }

    res.status(statusCode).json(response);
};