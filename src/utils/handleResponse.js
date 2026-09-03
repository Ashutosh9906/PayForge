const handleResponse = (
    res,
    status,
    message,
    success,
    data = null,
    code = null
) => {
    return res.status(status).json({
        success,
        message,
        code,
        data
    });
};

export default handleResponse;