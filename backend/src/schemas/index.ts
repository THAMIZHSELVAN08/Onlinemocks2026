// src/schemas/index.ts
import { z } from "zod";
import { registry } from "../openapi";

// ─────────────────────────────────────────────
// Reusable primitives
// ─────────────────────────────────────────────

const uuidSchema = z.string().uuid({ message: "Must be a valid UUID" });

const registerNumberSchema = z
  .string()
  .min(5, "Register number too short")
  .max(50, "Register number too long")
  .regex(/^[A-Za-z0-9]+$/, "Register number must be alphanumeric");

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password too long");

/** 0–10 rating used across all evaluation criteria */
const ratingSchema = z
  .number({ error: "Rating must be a number" })
  .int()
  .min(0, "Rating must be at least 0")
  .max(10, "Rating must be at most 10"); // ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    username: z.string().min(1).max(100),
    password: passwordSchema,
    role: z.enum(["HR", "STUDENT", "VOLUNTEER", "ADMIN"], {
      error: "Role must be HR, STUDENT, or VOLUNTEER",
    }),
    name: z.string().min(1, "Name is required").max(255).optional(),
    company_name: z.string().max(255).optional(),
    assignedHrId: uuidSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "HR" && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required for HR",
        path: ["name"],
      });
    }
    if (data.role === "VOLUNTEER" && !data.assignedHrId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "assignedHrId is required for VOLUNTEER",
        path: ["assignedHrId"],
      });
    }
  });
export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─────────────────────────────────────────────
// ADMIN — Register HR
// ─────────────────────────────────────────────

export const AdminRegisterHrSchema = z.object({
  username: z.string().min(1).max(100),
  password: passwordSchema,
  name: z.string().min(1, "HR name is required").max(255),
  company_name: z.string().min(1, "Company name is required").max(255),
});
export type AdminRegisterHrInput = z.infer<typeof AdminRegisterHrSchema>;

// ─────────────────────────────────────────────
// ADMIN — Register Volunteer
// ─────────────────────────────────────────────

export const AdminRegisterVolunteerSchema = z.object({
  username: z.string().min(1).max(100),
  password: passwordSchema,
  name: z.string().min(1, "Volunteer name is required").max(255),
  hrId: uuidSchema,
});
export type AdminRegisterVolunteerInput = z.infer<
  typeof AdminRegisterVolunteerSchema
>;

// ─────────────────────────────────────────────
// ADMIN — Bulk Transfer Students
// ─────────────────────────────────────────────

export const StudentTransferSchema = z.object({
  studentIds: z
    .array(uuidSchema)
    .min(1, "At least one student must be selected"),
  targetHrId: uuidSchema,
  reason: z.string().max(500).optional(),
});
export type StudentTransferInput = z.infer<typeof StudentTransferSchema>;

// ─────────────────────────────────────────────
// ADMIN — Student Search Query
// ─────────────────────────────────────────────

export const StudentSearchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required").max(500),
});
export type StudentSearchQuery = z.infer<typeof StudentSearchQuerySchema>;

// ─────────────────────────────────────────────
// ADMIN — HR ID param
// ─────────────────────────────────────────────

export const HrIdParamSchema = z.object({
  hrId: uuidSchema,
});
export type HrIdParam = z.infer<typeof HrIdParamSchema>;

// ─────────────────────────────────────────────
// HR — Evaluate Student
// ─────────────────────────────────────────────

export const EvaluationCriteriaSchema = z.object({
  appearance_attitude: ratingSchema,
  managerial_aptitude: ratingSchema,
  general_awareness: ratingSchema,
  technical_knowledge: ratingSchema,
  communication_skills: ratingSchema,
  ambition: ratingSchema,
  self_confidence: ratingSchema,
});
export type EvaluationCriteria = z.infer<typeof EvaluationCriteriaSchema>;

export const EvaluateStudentSchema = z.object({
  studentId: uuidSchema,
  criteria: EvaluationCriteriaSchema,
  strengths: z.string().max(1000).optional(),
  improvements: z.string().max(1000).optional(),
  comments: z.string().max(2000).optional(),
  overallScore: z
    .number()
    .min(0, "Overall score must be at least 0")
    .max(99.99, "Overall score must be at most 99.99")
    .multipleOf(0.01, "Overall score can have at most 2 decimal places"),
});
export type EvaluateStudentInput = z.infer<typeof EvaluateStudentSchema>;

// ─────────────────────────────────────────────
// HR — Student ID param
// ─────────────────────────────────────────────

export const StudentIdParamSchema = z.object({
  id: uuidSchema,
});
export type StudentIdParam = z.infer<typeof StudentIdParamSchema>;

// ─────────────────────────────────────────────
// STUDENT — Check-in
// ─────────────────────────────────────────────

export const CheckInSchema = z.object({
  deviceInfo: z.string().max(500).optional(),
});
export type CheckInInput = z.infer<typeof CheckInSchema>;

// ─────────────────────────────────────────────
// VOLUNTEER — Add Student
// ─────────────────────────────────────────────

export const AddStudentSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  register_number: registerNumberSchema,
  department: z.string().min(1, "Department is required").max(100),
  section: z.string().max(10).optional(),
});
export type AddStudentInput = z.infer<typeof AddStudentSchema>;

// ─────────────────────────────────────────────
// HR — Submit Feedback
// ─────────────────────────────────────────────

const rating5Schema = z.number().int().min(1).max(5);

export const SubmitFeedbackSchema = z.object({
  technicalKnowledge: rating5Schema,
  serviceAndCoordination: rating5Schema,
  communicationSkills: rating5Schema,
  futureParticipation: rating5Schema,
  punctualityAndInterest: rating5Schema,
  suggestions: z.string().max(2000).optional(),
  issuesFaced: z.string().max(2000).optional(),
  improvementSuggestions: z.string().max(2000).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;

// ─────────────────────────────────────────────
// Admin — HR Feedback Param
// ─────────────────────────────────────────────

export const FeedbackHrParamSchema = z.object({
  hrId: z.string().uuid(),
});

export type FeedbackHrParam = z.infer<typeof FeedbackHrParamSchema>;

// ─────────────────────────────────────────────
// ADMIN — Bulk CSV Student Row
// ─────────────────────────────────────────────

export const CsvStudentRowSchema = z
  .object({
    register_number: registerNumberSchema.optional(),
    username: registerNumberSchema.optional(), // fallback field
    name: z.string().min(1).max(255),
    department: z.string().max(100).optional(),
    section: z.string().max(10).optional(),
  })
  .transform((row) => ({
    ...row,
    register_number: row.register_number ?? row.username,
  }))
  .refine((row) => !!row.register_number, {
    message: "register_number or username is required",
    path: ["register_number"],
  });

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    role: z.enum(["ADMIN", "HR", "VOLUNTEER", "PIPELINE"]),
  }),
});

export const VolunteerStudentResponseSchema = z.object({
  assignmentId: z.number(),
  order: z.number(),
  status: z.string(),
  id: z.string().uuid(),
  name: z.string().nullable(),
  registerNumber: z.string(),
  department: z.string().nullable(),
  section: z.string().nullable(),
  resumeUrl: z.string().nullable(),
  aptitudeScore: z.number(),
  gdScore: z.number(),
  evaluation_status: z.enum(["COMPLETED", "INCOMPLETE"]),
});

registry.register("AuthResponse", AuthResponseSchema);

export const UserIdParamSchema = z.object({
  userId: z.string().uuid(),
});
export const AssignmentIdParamSchema = z.object({
  assignmentId: z.string().regex(/^\d+$/, "Assignment ID must be numeric"),
});
export type AssignmentIdParam = z.infer<typeof AssignmentIdParamSchema>;
registry.register("AssignmentIdParam", AssignmentIdParamSchema);
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
export type CsvStudentRow = z.infer<typeof CsvStudentRowSchema>;

// AUTH
registry.register("Login", LoginSchema);
registry.register("Register", RegisterSchema);

// ADMIN
registry.register("AdminRegisterHr", AdminRegisterHrSchema);
registry.register("AdminRegisterVolunteer", AdminRegisterVolunteerSchema);
registry.register("StudentTransfer", StudentTransferSchema);
registry.register("StudentSearchQuery", StudentSearchQuerySchema);
registry.register("HrIdParam", HrIdParamSchema);
registry.register("CsvStudentRow", CsvStudentRowSchema);

// HR
registry.register("EvaluationCriteria", EvaluationCriteriaSchema);
registry.register("EvaluateStudent", EvaluateStudentSchema);
registry.register("StudentIdParam", StudentIdParamSchema);

// STUDENT
registry.register("CheckIn", CheckInSchema);

// VOLUNTEER
registry.register("AddStudent", AddStudentSchema);
registry.register("UserIdParam", UserIdParamSchema);
registry.register("VolunteerStudentResponse", VolunteerStudentResponseSchema);
//ADMIN FEEDBACK
registry.register("SubmitFeedback", SubmitFeedbackSchema);
registry.register("FeedbackHrParam", FeedbackHrParamSchema);
