import { z } from "zod";

export const createVoterRegistrySchema = z.object({
  meetingId: z.string(),
  method: z.enum(["DIGITAL", "DOCUMENT"]).default("DIGITAL"),
  notes: z.string().optional(),
});

export const checkInMemberSchema = z.object({
  voterRegistryId: z.string(),
  memberId: z.string(),
  votingShares: z.number().optional(),
  notes: z.string().optional(),
});

export const lockRegistrySchema = z.object({
  id: z.string(),
});

export const registerProxySchema = z.object({
  meetingId: z.string(),
  memberId: z.string(),
  proxyType: z.enum(["MEMBER", "EXTERNAL"]),
  // Member proxy
  proxyMemberId: z.string().optional(),
  // External proxy
  externalName: z.string().optional(),
  externalPersonalId: z.string().optional(),
  externalAddress: z.string().optional(),
  externalPhone: z.string().optional(),
  externalEmail: z.string().optional(),
}).refine(
  (data) => {
    if (data.proxyType === "MEMBER") return !!data.proxyMemberId;
    if (data.proxyType === "EXTERNAL") return !!data.externalName && !!data.externalPersonalId;
    return true;
  },
  { message: "Ombudsuppgifter saknas" }
);

export const approveProxySchema = z.object({
  id: z.string(),
});
