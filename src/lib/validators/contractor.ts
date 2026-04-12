import { z } from "zod";

export const createContractorSchema = z.object({
  name: z.string().min(1, "Namn krävs"),
  category: z.string().min(1, "Kategori krävs"),
  orgNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  country: z.string().default("SE"),
  fTax: z.boolean().default(false),
  fTaxVerifiedAt: z.date().optional(),
  vatRegistered: z.boolean().default(false),
  insuranceCoverage: z.boolean().default(false),
  insuranceExpiry: z.date().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  streetAddress: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  pubAgreement: z.boolean().default(false),
  pubAgreementDate: z.date().optional(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  bankgiro: z.string().optional(),
  plusgiro: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  swish: z.string().optional(),
});

export const updateContractorSchema = z.object({
  id: z.string(),
}).merge(createContractorSchema.partial());

export const createContactSchema = z.object({
  contractorId: z.string(),
  name: z.string().min(1, "Namn krävs"),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  isPrimary: z.boolean().default(false),
});
