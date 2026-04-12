import { z } from "zod";
import { router, protectedProcedure, publicProcedure, requirePermission } from "../trpc";
import { submitApplicationSchema, reviewApplicationSchema } from "@/lib/validators/membership";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { logPersonalDataAccess } from "@/lib/gdpr";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const membershipRouter = router({
  // List all applications (board view)
  listApplications: protectedProcedure
    .use(requirePermission("application:review"))
    .input(
      z.object({
        status: z.enum(["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.membershipApplication.findMany({
        where: { status: input?.status },
        include: {
          apartment: {
            select: {
              number: true,
              building: { select: { name: true } },
              ownerships: {
                where: { active: true },
                select: { ownershipShare: true, userId: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getApplication: protectedProcedure
    .use(requirePermission("application:review"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const app = await ctx.db.membershipApplication.findUnique({
        where: { id: input.id },
        include: {
          apartment: {
            include: {
              building: { select: { name: true, address: true } },
              ownerships: {
                where: { active: true },
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
      });
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      logPersonalDataAccess(ctx.user.id as string, "VIEW_APPLICATION", null, `application:${input.id}`);

      return app;
    }),

  // Submit application (can be public or authenticated)
  submit: publicProcedure
    .input(submitApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate ownership doesn't exceed 100%
      const currentOwnerships = await ctx.db.apartmentOwnership.findMany({
        where: { apartmentId: input.apartmentId, active: true },
      });
      const currentTotal = currentOwnerships.reduce((s, o) => s + o.ownershipShare, 0);

      // Also check pending applications
      const pendingApps = await ctx.db.membershipApplication.findMany({
        where: {
          apartmentId: input.apartmentId,
          status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        },
      });
      const pendingTotal = pendingApps.reduce((s, a) => s + a.ownershipShare, 0);

      const projectedTotal = currentTotal + pendingTotal + input.ownershipShare;
      if (projectedTotal > 1.001) { // Small epsilon for float precision
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Ägarandelen överstiger 100%. Nuvarande: ${(currentTotal * 100).toFixed(1)}%, väntande ansökningar: ${(pendingTotal * 100).toFixed(1)}%, begärd: ${(input.ownershipShare * 100).toFixed(1)}%. Totalt: ${(projectedTotal * 100).toFixed(1)}%`,
        });
      }

      return ctx.db.membershipApplication.create({
        data: input,
      });
    }),

  // Review application (approve/reject)
  review: protectedProcedure
    .use(requirePermission("application:review"))
    .input(reviewApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const app = await ctx.db.membershipApplication.findUnique({
        where: { id: input.id },
        include: {
          apartment: {
            include: {
              ownerships: { where: { active: true } },
            },
          },
        },
      });

      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["SUBMITTED", "UNDER_REVIEW"].includes(app.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ansökan kan inte granskas i nuvarande status" });
      }

      if (input.status === "APPROVED") {
        // Final validation: check ownership <= 100%
        const currentTotal = app.apartment.ownerships.reduce((s, o) => s + o.ownershipShare, 0);
        if (currentTotal + app.ownershipShare > 1.001) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Kan inte godkänna — ägarandelen skulle överstiga 100%. Nuvarande: ${(currentTotal * 100).toFixed(1)}%, ansökan: ${(app.ownershipShare * 100).toFixed(1)}%`,
          });
        }

        // Handle person vs organization
        const isOrg = app.applicantType === "ORGANIZATION";

        if (isOrg) {
          // Organization ownership
          let orgId = app.organizationId;
          if (!orgId && app.organizationName && app.organizationOrgNr) {
            const org = await ctx.db.organization.create({
              data: {
                name: app.organizationName,
                orgNumber: app.organizationOrgNr,
                email: app.email,
              },
            });
            orgId = org.id;
          }
          if (!orgId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Organisationsuppgifter saknas" });
          }

          await ctx.db.apartmentOwnership.create({
            data: {
              apartmentId: app.apartmentId,
              ownerType: "ORGANIZATION",
              organizationId: orgId,
              ownershipShare: app.ownershipShare,
              acquiredAt: app.transferDate ?? new Date(),
            },
          });
        } else {
          // Person ownership
          let userId = app.applicantUserId;

          if (!userId) {
            const passwordHash = await hash("changeme123", 12);
            const user = await ctx.db.user.create({
              data: {
                email: app.email,
                firstName: app.firstName ?? "",
                lastName: app.lastName ?? "",
                phone: app.phone,
                passwordHash,
                apartmentId: app.apartmentId,
              },
            });
            userId = user.id;
          } else {
            await ctx.db.user.update({
              where: { id: userId },
              data: { apartmentId: app.apartmentId },
            });
          }

          await ctx.db.apartmentOwnership.create({
            data: {
              apartmentId: app.apartmentId,
              ownerType: "PERSON",
              userId,
              ownershipShare: app.ownershipShare,
              acquiredAt: app.transferDate ?? new Date(),
            },
          });

          // Add MEMBER role
          await ctx.db.userRole.upsert({
            where: { userId_role: { userId, role: "MEMBER" } },
            update: { active: true },
            create: { userId, role: "MEMBER", grantedBy: ctx.user.id },
          });
        }

        // Update application
        const result = await ctx.db.membershipApplication.update({
          where: { id: input.id },
          data: {
            status: "APPROVED",
            reviewedAt: new Date(),
            reviewedBy: ctx.user.id,
            boardNotes: input.boardNotes,
          },
        });

        logActivity({ userId: ctx.user.id as string, action: "membership.approve", entityType: "MembershipApplication", entityId: input.id, description: `Godkände medlemsansökan: ${app.firstName} ${app.lastName}`, before: { status: app.status }, after: { status: "APPROVED", decisionId: input.decisionId } });

        return result;
      }

      // REJECTED
      if (!input.rejectionReason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ange anledning till avslag (lagkrav)" });
      }

      const result = await ctx.db.membershipApplication.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          rejectionReason: input.rejectionReason,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
          boardNotes: input.boardNotes,
        },
      });

      logActivity({ userId: ctx.user.id as string, action: "membership.reject", entityType: "MembershipApplication", entityId: input.id, description: `Avslog medlemsansökan: ${app.firstName} ${app.lastName} — ${input.rejectionReason}`, before: { status: app.status }, after: { status: "REJECTED", rejectionReason: input.rejectionReason } });

      return result;
    }),

  // Get ownership summary for an apartment
  // Pending applications ready for board review
  getPending: protectedProcedure
    .use(requirePermission("application:review"))
    .query(async ({ ctx }) => {
      return ctx.db.membershipApplication.findMany({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        include: {
          apartment: { select: { number: true, building: { select: { name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  getOwnership: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .input(z.object({ apartmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ownerships = await ctx.db.apartmentOwnership.findMany({
        where: { apartmentId: input.apartmentId, active: true },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { acquiredAt: "asc" },
      });
      const totalShare = ownerships.reduce((s, o) => s + o.ownershipShare, 0);
      return { ownerships, totalShare, remainingShare: 1 - totalShare };
    }),
});
