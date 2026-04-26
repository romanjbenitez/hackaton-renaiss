import { z } from "zod";

const tenantProfileTypes = ["EMPLOYED", "MONOTRIBUTISTA", "SELF_EMPLOYED", "RETIRED"] as const;

const guaranteeTypes = ["MORTGAGE", "CAUTION_INSURANCE", "NONE"] as const;

export const onboardingStep1Schema = z.object({
  dni: z
    .string()
    .min(7, "DNI inválido")
    .max(9, "DNI inválido")
    .regex(/^\d+$/, "El DNI solo puede contener números"),
  profileType: z.enum(tenantProfileTypes, {
    message: "Seleccioná un tipo de perfil",
  }),
  occupation: z.string().min(2, "Ingresá tu ocupación").max(100),
  monthlyIncome: z
    .string()
    .min(1, "Ingresá tus ingresos")
    .transform((v) => Number(v.replace(/\D/g, "")))
    .refine((v) => v > 0, "El ingreso debe ser mayor a 0"),
});

export const onboardingStep2Schema = z.object({
  hasPets: z.enum(["true", "false"]).transform((v) => v === "true"),
  isSmoker: z.enum(["true", "false"]).transform((v) => v === "true"),
  hasChildren: z.enum(["true", "false"]).transform((v) => v === "true"),
  familyMembers: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => v >= 1 && v <= 10, "Cantidad inválida"),
  guaranteeType: z.enum(guaranteeTypes, {
    message: "Seleccioná un tipo de garantía",
  }),
  guaranteeDetails: z.string().max(300).optional(),
});

export type OnboardingStep1Input = z.input<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.input<typeof onboardingStep2Schema>;
