export function buildValidationFields(schema, req) {
    const validationFields = {};

    if (schema.shape.body)
        validationFields.body = req.body;

    if (schema.shape.headers)
        validationFields.headers = req.headers;

    if (schema.shape.params)
        validationFields.params = req.params;

    if (schema.shape.query)
        validationFields.query = req.query;

    return validationFields;
}