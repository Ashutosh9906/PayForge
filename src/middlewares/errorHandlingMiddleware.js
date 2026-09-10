import handleResponse from "../utils/handleResponse.js";

const errorHandling = (err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || 500;

    const message = err.isOperational
        ? err.message
        : "Internal Server Error";

    const code = err.isOperational
        ? err.code
        : "INTERNAL_SERVER_ERROR";

    const data = err.isOperational
        ? err.details ?? null
        : null;

    return handleResponse(
        res,
        statusCode,
        message,
        false,
        data,
        code
    );
};

export default errorHandling;