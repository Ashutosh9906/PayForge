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

    return handleResponse(
        res,
        statusCode,
        message,
        false,
        null,
        code
    );
};

export default errorHandling;