"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
/**
 * Express middleware factory that validates a specific part of the request
 * against a Zod schema. On failure, returns a 400 with structured errors.
 *
 * Usage:
 *   router.post('/evaluate', auth, validate(EvaluateStudentSchema), handler)
 *   router.get('/students', auth, validate(StudentSearchQuerySchema, 'query'), handler)
 *   router.get('/hrs/:hrId/students', auth, validate(HrIdParamSchema, 'params'), handler)
 */
function validate(schema, part = "body") {
    return (req, res, next) => {
        const result = schema.safeParse(req[part]);
        if (!result.success) {
            const errors = formatZodErrors(result.error);
            return res.status(400).json({
                message: "Validation failed",
                errors,
            });
        }
        // Attach parsed (and potentially transformed) data back to request
        req[part] = result.data;
        next();
    };
}
function formatZodErrors(error) {
    return error.issues.map((e) => ({
        field: e.path.join(".") || "root",
        message: e.message,
    }));
}
