import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Företagsnamn krävs"),
  orgNumber: z.string().min(1, "Organisationsnummer krävs"),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  contactPerson: z.string().optional(),
});

export const updateOrganizationSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const addRepresentativeSchema = z.object({
  organizationId: z.string(),
  personalId: z.string().min(1, "Personnummer krävs"),
  firstName: z.string().min(1, "Förnamn krävs"),
  lastName: z.string().min(1, "Efternamn krävs"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const uploadMandateSchema = z.object({
  organizationId: z.string(),
  documentName: z.string().min(1),
  documentUrl: z.string().min(1),
  documentSize: z.number().optional(),
  mimeType: z.string().optional(),
  description: z.string().optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional().nullable(),
});
