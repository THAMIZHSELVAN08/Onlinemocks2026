import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "HR", "VOLUNTEER", "PIPELINE"]),
  name: z.string(),
  company_name: z.string().optional(),
});
