import { router } from "./trpc";
import { meetingRouter } from "./routers/meeting";
import { agendaRouter } from "./routers/agenda";
import { attendanceRouter } from "./routers/attendance";
import { protocolRouter } from "./routers/protocol";
import { decisionRouter } from "./routers/decision";
import { voteRouter } from "./routers/vote";
import { expenseRouter } from "./routers/expense";
import { taskRouter } from "./routers/task";
import { damageReportRouter } from "./routers/damage-report";

export const appRouter = router({
  meeting: meetingRouter,
  agenda: agendaRouter,
  attendance: attendanceRouter,
  protocol: protocolRouter,
  decision: decisionRouter,
  vote: voteRouter,
  expense: expenseRouter,
  task: taskRouter,
  damageReport: damageReportRouter,
});

export type AppRouter = typeof appRouter;
