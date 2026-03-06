"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelAssignmentResponseSchema = exports.AssignmentIdParamSchema = exports.UserIdParamSchema = exports.CancelAssignmentParamSchema = exports.VolunteerStudentResponseSchema = exports.AuthResponseSchema = exports.CsvStudentRowSchema = exports.FeedbackHrParamSchema = exports.SubmitFeedbackSchema = exports.AddStudentSchema = exports.StudentIdParamSchema = exports.EvaluateStudentSchema = exports.EvaluationCriteriaSchema = exports.HrIdParamSchema = exports.StudentSearchQuerySchema = exports.StudentTransferSchema = exports.AdminRegisterPipelineSchema = exports.AdminRegisterVolunteerSchema = exports.AdminRegisterHrSchema = exports.RegisterSchema = exports.LoginSchema = void 0;
// src/schemas/index.ts
const zod_1 = require("zod");
const openapi_1 = require("../openapi");
// ─────────────────────────────────────────────
// Reusable primitives
// ─────────────────────────────────────────────
const uuidSchema = zod_1.z.string().uuid({ message: "Must be a valid UUID" });
const registerNumberSchema = zod_1.z
    .string()
    .min(5, "Register number too short")
    .max(50, "Register number too long")
    .regex(/^[A-Za-z0-9]+$/, "Register number must be alphanumeric");
const passwordSchema = zod_1.z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long");
/** 0–10 rating used across all evaluation criteria */
const ratingSchema = zod_1.z
    .number({ error: "Rating must be a number" })
    .int()
    .min(0, "Rating must be at least 0")
    .max(10, "Rating must be at most 10"); // ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
exports.LoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username is required").max(100),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.RegisterSchema = zod_1.z
    .object({
    username: zod_1.z.string().min(1).max(100),
    password: passwordSchema,
    role: zod_1.z.enum(["HR", "VOLUNTEER", "ADMIN", "PIPELINE"], {
        error: "Role must be HR, VOLUNTEER, ADMIN, or PIPELINE",
    }),
    name: zod_1.z.string().min(1, "Name is required").max(255).optional(),
    company_name: zod_1.z.string().max(255).optional(),
    assignedHrId: uuidSchema.optional(),
})
    .superRefine((data, ctx) => {
    if (data.role === "HR" && !data.name) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Name is required for HR",
            path: ["name"],
        });
    }
    if (data.role === "VOLUNTEER" && !data.assignedHrId) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "assignedHrId is required for VOLUNTEER",
            path: ["assignedHrId"],
        });
    }
});
// ─────────────────────────────────────────────
// ADMIN — Register HR
// ─────────────────────────────────────────────
exports.AdminRegisterHrSchema = zod_1.z.object({
    username: zod_1.z.string().min(1).max(100),
    password: passwordSchema,
    name: zod_1.z.string().min(1, "HR name is required").max(255),
    company_name: zod_1.z.string().min(1, "Company name is required").max(255),
});
// ─────────────────────────────────────────────
// ADMIN — Register Volunteer
// ─────────────────────────────────────────────
exports.AdminRegisterVolunteerSchema = zod_1.z.object({
    username: zod_1.z.string().min(1).max(100),
    password: passwordSchema,
    name: zod_1.z.string().min(1, "Volunteer name is required").max(255),
    hrId: uuidSchema,
});
// ─────────────────────────────────────────────
// ADMIN — Register Pipeline
// ─────────────────────────────────────────────
exports.AdminRegisterPipelineSchema = zod_1.z.object({
    username: zod_1.z.string().min(1).max(100),
    password: passwordSchema,
    name: zod_1.z.string().min(1, "Pipeline name is required").max(255),
});
// ─────────────────────────────────────────────
// ADMIN — Bulk Transfer Students
// ─────────────────────────────────────────────
exports.StudentTransferSchema = zod_1.z.object({
    studentIds: zod_1.z
        .array(uuidSchema)
        .min(1, "At least one student must be selected"),
    targetHrId: uuidSchema,
    reason: zod_1.z.string().max(500).optional(),
});
// ─────────────────────────────────────────────
// ADMIN — Student Search Query
// ─────────────────────────────────────────────
exports.StudentSearchQuerySchema = zod_1.z.object({
    query: zod_1.z.string().min(1, "Search query is required").max(500),
});
// ─────────────────────────────────────────────
// ADMIN — HR ID param
// ─────────────────────────────────────────────
exports.HrIdParamSchema = zod_1.z.object({
    hrId: zod_1.z.string().refine((val) => val === "unassigned" || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val), {
        message: "Must be a valid UUID or 'unassigned'"
    }),
});
// ─────────────────────────────────────────────
// HR — Evaluate Student
// ─────────────────────────────────────────────
exports.EvaluationCriteriaSchema = zod_1.z.object({
    appearanceAttitude: ratingSchema,
    managerialAptitude: ratingSchema,
    generalAwareness: ratingSchema,
    technicalKnowledge: ratingSchema,
    communicationSkills: ratingSchema,
    ambition: ratingSchema,
    selfConfidence: ratingSchema,
});
exports.EvaluateStudentSchema = zod_1.z.object({
    studentId: uuidSchema,
    criteria: exports.EvaluationCriteriaSchema,
    strengths: zod_1.z.string().max(1000).optional(),
    improvements: zod_1.z.string().max(1000).optional(),
    comments: zod_1.z.string().max(2000).optional(),
    overallScore: zod_1.z
        .number()
        .min(0, "Overall score must be at least 0")
        .max(99.99, "Overall score must be at most 99.99")
        .multipleOf(0.01, "Overall score can have at most 2 decimal places"),
});
// ─────────────────────────────────────────────
// HR — Student ID param
// ─────────────────────────────────────────────
exports.StudentIdParamSchema = zod_1.z.object({
    id: uuidSchema,
});
// ─────────────────────────────────────────────
// VOLUNTEER — Add Student
// ─────────────────────────────────────────────
exports.AddStudentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(255),
    register_number: registerNumberSchema,
    department: zod_1.z.string().min(1, "Department is required").max(100),
    section: zod_1.z.string().max(10).optional(),
    resume_url: zod_1.z.string().max(1000).optional(),
});
// ─────────────────────────────────────────────
// HR — Submit Feedback
// ─────────────────────────────────────────────
const rating5Schema = zod_1.z.number().int().min(1).max(5);
exports.SubmitFeedbackSchema = zod_1.z.object({
    technicalKnowledge: ratingSchema,
    serviceAndCoordination: ratingSchema,
    communicationSkills: ratingSchema,
    futureParticipation: ratingSchema,
    punctualityAndInterest: ratingSchema,
    suggestions: zod_1.z.string().max(2000).optional(),
    issuesFaced: zod_1.z.string().max(2000).optional(),
    improvementSuggestions: zod_1.z.string().max(2000).optional(),
});
// ─────────────────────────────────────────────
// Admin — HR Feedback Param
// ─────────────────────────────────────────────
exports.FeedbackHrParamSchema = zod_1.z.object({
    hrId: zod_1.z.string().uuid(),
});
// ─────────────────────────────────────────────
// ADMIN — Bulk CSV Student Row
// ─────────────────────────────────────────────
exports.CsvStudentRowSchema = zod_1.z
    .object({
    register_number: registerNumberSchema.optional(),
    username: registerNumberSchema.optional(), // fallback field
    name: zod_1.z.string().min(1).max(255),
    department: zod_1.z.string().max(100).optional(),
    section: zod_1.z.string().max(10).optional(),
    resume: zod_1.z.string().max(1000).optional(),
})
    .transform((row) => ({
    ...row,
    register_number: row.register_number ?? row.username,
}))
    .refine((row) => !!row.register_number, {
    message: "register_number or username is required",
    path: ["register_number"],
});
exports.AuthResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    user: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        username: zod_1.z.string(),
        role: zod_1.z.enum(["ADMIN", "HR", "VOLUNTEER", "PIPELINE"]),
    }),
});
exports.VolunteerStudentResponseSchema = zod_1.z.object({
    assignmentId: zod_1.z.number(),
    order: zod_1.z.number(),
    status: zod_1.z.string(),
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().nullable(),
    registerNumber: zod_1.z.string(),
    department: zod_1.z.string().nullable(),
    section: zod_1.z.string().nullable(),
    resumeUrl: zod_1.z.string().nullable(),
    aptitudeScore: zod_1.z.number(),
    gdScore: zod_1.z.number(),
    evaluation_status: zod_1.z.enum(["COMPLETED", "INCOMPLETE"]),
});
// ─────────────────────────────────────────────
// VOLUNTEER — Cancel Assignment Param
// ─────────────────────────────────────────────
exports.CancelAssignmentParamSchema = zod_1.z.object({
    assignmentId: zod_1.z.coerce.number().int().positive(),
});
openapi_1.registry.register("AuthResponse", exports.AuthResponseSchema);
exports.UserIdParamSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
exports.AssignmentIdParamSchema = zod_1.z.object({
    assignmentId: zod_1.z.string().regex(/^\d+$/, "Assignment ID must be numeric"),
});
openapi_1.registry.register("AssignmentIdParam", exports.AssignmentIdParamSchema);
exports.CancelAssignmentResponseSchema = zod_1.z.object({
    message: zod_1.z.string(),
});
// AUTH
openapi_1.registry.register("Login", exports.LoginSchema);
openapi_1.registry.register("Register", exports.RegisterSchema);
// ADMIN
openapi_1.registry.register("AdminRegisterHr", exports.AdminRegisterHrSchema);
openapi_1.registry.register("AdminRegisterVolunteer", exports.AdminRegisterVolunteerSchema);
openapi_1.registry.register("StudentTransfer", exports.StudentTransferSchema);
openapi_1.registry.register("StudentSearchQuery", exports.StudentSearchQuerySchema);
openapi_1.registry.register("HrIdParam", exports.HrIdParamSchema);
openapi_1.registry.register("CsvStudentRow", exports.CsvStudentRowSchema);
// HR
openapi_1.registry.register("EvaluationCriteria", exports.EvaluationCriteriaSchema);
openapi_1.registry.register("EvaluateStudent", exports.EvaluateStudentSchema);
openapi_1.registry.register("StudentIdParam", exports.StudentIdParamSchema);
// VOLUNTEER
openapi_1.registry.register("AddStudent", exports.AddStudentSchema);
openapi_1.registry.register("UserIdParam", exports.UserIdParamSchema);
openapi_1.registry.register("VolunteerStudentResponse", exports.VolunteerStudentResponseSchema);
openapi_1.registry.register("CancelAssignmentParam", exports.CancelAssignmentParamSchema);
openapi_1.registry.register("CancelAssignmentResponse", exports.CancelAssignmentResponseSchema);
//ADMIN FEEDBACK
openapi_1.registry.register("SubmitFeedback", exports.SubmitFeedbackSchema);
openapi_1.registry.register("FeedbackHrParam", exports.FeedbackHrParamSchema);
