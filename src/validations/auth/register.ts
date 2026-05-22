import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(1, "Nama harus diisi"),
    email: z
      .string()
      .min(1, "Email harus diisi")
      .email("Format email tidak valid"),
    password: z
      .string()
      .min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
    tenantId: z.number().min(1, "Tenant harus dipilih"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
