"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(["ADMIN", "HR", "VOLUNTEER", "PIPELINE"]),
    name: zod_1.z.string(),
    company_name: zod_1.z.string().optional(),
});
