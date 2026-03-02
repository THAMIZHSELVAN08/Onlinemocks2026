// src/types/auth.ts
// src/types/auth.ts

import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  username: string;
  role: "ADMIN" | "HR" | "PIPELINE" | "VOLUNTEER";
}
