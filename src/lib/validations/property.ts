import { z } from "zod";

const propertyTypes = [
  "APARTMENT",
  "HOUSE",
  "PH",
  "STUDIO",
  "OFFICE",
  "COMMERCIAL",
  "LAND",
  "OTHER",
] as const;

const propertyStatuses = ["DRAFT", "PUBLISHED", "PAUSED"] as const;

const guaranteeTypes = ["MORTGAGE", "CAUTION_INSURANCE", "NONE"] as const;

const profileTypes = ["EMPLOYED", "MONOTRIBUTISTA", "SELF_EMPLOYED", "RETIRED"] as const;

function parseCurrencyInput(value: string) {
  return Number(value.replace(/[^\d]/g, ""));
}

export const propertyBasicsSchema = z.object({
  title: z.string().min(5, "Ingresá un título más descriptivo").max(80),
  addressLine: z.string().min(5, "Ingresá la dirección").max(120),
  city: z.string().min(2, "Ingresá la ciudad").max(60),
  province: z.string().min(2, "Ingresá la provincia").max(60),
  propertyType: z.enum(propertyTypes, {
    message: "Seleccioná un tipo de propiedad",
  }),
  squareMeters: z.number().positive("La superficie debe ser mayor a 0"),
  price: z.number().positive("El alquiler debe ser mayor a 0"),
});

export const propertyMediaSchema = z.object({
  photos: z
    .string()
    .min(1, "Cargá al menos una foto")
    .transform((value) =>
      value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    )
    .refine((value) => value.length > 0, "Cargá al menos una foto"),
  externalUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^https?:\/\/\S+$/i.test(value), "Ingresá una URL válida"),
});

export const propertyCompatibilitySchema = z.object({
  targetTrustScore: z.number().min(0).max(100),
  acceptedGuarantees: z
    .array(z.enum(guaranteeTypes))
    .refine((value) => value.length > 0, "Elegí al menos una garantía aceptada"),
  acceptsPets: z.boolean(),
  acceptsSmokers: z.boolean(),
  acceptsChildren: z.boolean(),
  compatibilityNotes: z.string().max(300).optional(),
});

export const propertyFormSchema = propertyBasicsSchema
  .merge(propertyMediaSchema)
  .merge(propertyCompatibilitySchema);

export const createPropertySchema = z.object({
  title: z.string().min(5, "Ingresá un título más descriptivo").max(80),
  addressLine: z.string().min(5, "Ingresá la dirección").max(120),
  city: z.string().min(2, "Ingresá la ciudad").max(60),
  province: z.string().min(2, "Ingresá la provincia").max(60),
  propertyType: z.enum(propertyTypes, {
    message: "Seleccioná un tipo de propiedad",
  }),
  squareMeters: z
    .string()
    .min(1, "Ingresá los metros cuadrados")
    .transform((value) => Number(value))
    .refine((value) => value > 0, "La superficie debe ser mayor a 0"),
  bedrooms: z
    .string()
    .transform((value) => Number(value))
    .refine((value) => value >= 0 && value <= 20, "Cantidad de ambientes inválida"),
  bathrooms: z
    .string()
    .transform((value) => Number(value))
    .refine((value) => value >= 1 && value <= 20, "Cantidad de baños inválida"),
  price: z
    .string()
    .min(1, "Ingresá el valor del alquiler")
    .transform(parseCurrencyInput)
    .refine((value) => value > 0, "El alquiler debe ser mayor a 0"),
  expenses: z
    .string()
    .optional()
    .transform((value) => (value ? parseCurrencyInput(value) : 0)),
  externalUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^https?:\/\/\S+$/i.test(value), "Ingresá una URL válida"),
  photoUrls: z
    .string()
    .max(1000)
    .transform((value) =>
      value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    )
    .refine((value) => value.length > 0, "Cargá al menos una foto o URL")
    .refine(
      (value) => value.every((item) => /^https?:\/\/\S+$/i.test(item)),
      "Revisá las URLs de fotos"
    ),
  targetTrustScore: z
    .string()
    .min(1, "Definí el score aspiracional")
    .transform((value) => Number(value))
    .refine((value) => value >= 0 && value <= 100, "El score debe estar entre 0 y 100"),
  acceptedGuarantees: z
    .array(z.enum(guaranteeTypes))
    .refine((value) => value.length > 0, "Elegí al menos una garantía aceptada"),
  preferredProfile: z.enum(profileTypes).optional(),
  acceptsPets: z.boolean(),
  acceptsSmokers: z.boolean(),
  acceptsChildren: z.boolean(),
  compatibilityNotes: z.string().max(300).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(propertyStatuses, {
    message: "Elegí un estado válido",
  }),
});

export type CreatePropertyInput = z.output<typeof createPropertySchema>;
export type PropertyFormInput = z.output<typeof propertyFormSchema>;
