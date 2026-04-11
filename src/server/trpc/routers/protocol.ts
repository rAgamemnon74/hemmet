import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { upsertProtocolSchema } from "@/lib/validators/meeting";
import { TRPCError } from "@trpc/server";

export const protocolRouter = router({
  // Update protocol content — only if DRAFT or FINALIZED (by secretary)
  upsert: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(upsertProtocolSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
      });

      if (existing) {
        // SIGNED/ARCHIVED = fully locked
        if (existing.status === "SIGNED" || existing.status === "ARCHIVED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Protokollet är justerat och kan inte ändras.",
          });
        }

        // FINALIZED = only the secretary who finalized can edit
        if (existing.status === "FINALIZED" && existing.finalizedBy !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Protokollet är slutbehandlat. Bara sekreteraren kan göra korrigeringar.",
          });
        }

        return ctx.db.protocol.update({
          where: { meetingId: input.meetingId },
          data: { content: input.content },
        });
      }

      return ctx.db.protocol.create({
        data: { meetingId: input.meetingId, content: input.content },
      });
    }),

  // Secretary finalizes — locks for other editors
  finalize: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
      });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND", message: "Inget protokoll att slutbehandla" });
      if (protocol.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Protokollet är redan slutbehandlat" });
      }

      return ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: {
          status: "FINALIZED",
          finalizedAt: new Date(),
          finalizedBy: ctx.user.id as string,
        },
      });
    }),

  // Reopen — secretary can pull back to DRAFT if needed
  reopen: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
      });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });
      if (protocol.status !== "FINALIZED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan bara återöppna slutbehandlade protokoll" });
      }
      if (protocol.finalizedBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bara sekreteraren som slutbehandlade kan återöppna" });
      }

      return ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: { status: "DRAFT", finalizedAt: null, finalizedBy: null },
      });
    }),

  // Sign — ordförande or justerare adds their signature
  sign: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
        include: {
          meeting: {
            select: { meetingChairpersonId: true, adjusters: true },
          },
        },
      });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });
      if (protocol.status !== "FINALIZED" && protocol.status !== "SIGNED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Protokollet måste vara slutbehandlat innan det kan signeras" });
      }

      const userId = ctx.user.id as string;

      // Verify signer is ordförande or justerare
      const isChairperson = protocol.meeting.meetingChairpersonId === userId;
      const isAdjuster = protocol.meeting.adjusters.includes(userId);
      if (!isChairperson && !isAdjuster) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bara mötesordförande och justerare kan signera protokollet" });
      }

      // Check not already signed by this user
      if (protocol.signedBy.includes(userId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Du har redan signerat detta protokoll" });
      }

      const newSignedBy = [...protocol.signedBy, userId];

      // Check if all required signers have signed (chairperson + all adjusters)
      const requiredSigners = [
        protocol.meeting.meetingChairpersonId,
        ...protocol.meeting.adjusters,
      ].filter(Boolean) as string[];
      const allSigned = requiredSigners.every((id) => newSignedBy.includes(id));

      return ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: {
          signedBy: newSignedBy,
          signedAt: new Date(),
          status: allSigned ? "SIGNED" : "FINALIZED",
        },
      });
    }),

  // Archive — final lock after signing
  archive: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
      });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });
      if (protocol.status !== "SIGNED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Protokollet måste vara signerat innan det kan arkiveras" });
      }

      return ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
    }),
});
