import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";

export const bookingRouter = router({
  // List available resources
  listResources: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.bookableResource.findMany({
      where: { active: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  }),

  // Get bookings for a resource (next 14 days)
  getBookings: protectedProcedure
    .input(z.object({ resourceId: z.string(), from: z.coerce.date().optional() }))
    .query(async ({ ctx, input }) => {
      const from = input.from ?? new Date();
      const to = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);

      return ctx.db.booking.findMany({
        where: {
          resourceId: input.resourceId,
          startTime: { gte: from, lt: to },
          cancelledAt: null,
        },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { startTime: "asc" },
      });
    }),

  // My bookings
  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.booking.findMany({
      where: { userId: ctx.user.id as string, cancelledAt: null, endTime: { gte: new Date() } },
      include: { resource: { select: { name: true, type: true } } },
      orderBy: { startTime: "asc" },
    });
  }),

  // Create booking
  book: protectedProcedure
    .input(z.object({
      resourceId: z.string(),
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const resource = await ctx.db.bookableResource.findUnique({ where: { id: input.resourceId } });
      if (!resource || !resource.active) throw new TRPCError({ code: "NOT_FOUND", message: "Resursen finns inte" });

      // Validate duration
      const hours = (input.endTime.getTime() - input.startTime.getTime()) / (60 * 60 * 1000);
      if (hours > resource.maxDurationHours) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Max bokningslängd är ${resource.maxDurationHours} timmar` });
      }
      if (hours <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sluttid måste vara efter starttid" });
      }

      // Validate advance booking
      const daysAhead = (input.startTime.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      if (daysAhead > resource.advanceBookingDays) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Kan bara boka ${resource.advanceBookingDays} dagar framåt` });
      }

      // Check for conflicts
      const conflict = await ctx.db.booking.findFirst({
        where: {
          resourceId: input.resourceId,
          cancelledAt: null,
          OR: [
            { startTime: { lt: input.endTime }, endTime: { gt: input.startTime } },
          ],
        },
      });
      if (conflict) {
        throw new TRPCError({ code: "CONFLICT", message: "Tiden är redan bokad" });
      }

      const result = await ctx.db.booking.create({
        data: { ...input, userId: ctx.user.id as string },
      });

      logActivity({ userId: ctx.user.id as string, action: "booking.create", entityType: "Booking", entityId: result.id, description: `Bokade ${resource.name}`, after: { startTime: input.startTime, endTime: input.endTime } });

      return result;
    }),

  // Cancel booking
  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({ where: { id: input.id } });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Du kan bara avboka dina egna bokningar" });
      }

      const result = await ctx.db.booking.update({
        where: { id: input.id },
        data: { cancelledAt: new Date() },
      });

      logActivity({ userId: ctx.user.id as string, action: "booking.cancel", entityType: "Booking", entityId: input.id, description: "Avbokade", before: { cancelledAt: null }, after: { cancelledAt: new Date() } });

      return result;
    }),
});
