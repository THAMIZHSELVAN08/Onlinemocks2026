// src/types/auth.ts
export type AuthUser = {
  id: string;
  role: "ADMIN" | "HR" | "STUDENT" | "VOLUNTEER";
};
