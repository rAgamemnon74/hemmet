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
import { annualReportRouter } from "./routers/annual-report";
import { auditRouter } from "./routers/audit";
import { announcementRouter } from "./routers/announcement";
import { memberRouter } from "./routers/member";
import { motionRouter } from "./routers/motion";
import { suggestionRouter } from "./routers/suggestion";
import { voterRegistryRouter } from "./routers/voter-registry";
import { apartmentRouter } from "./routers/apartment";
import { membershipRouter } from "./routers/membership";
import { organizationRouter } from "./routers/organization";
import { brfRulesRouter } from "./routers/brf-rules";
import { settingsRouter } from "./routers/settings";
import { annualMeetingRouter } from "./routers/annual-meeting";
import { meetingLiveRouter } from "./routers/meeting-live";
import { documentRouter } from "./routers/document";
import { profileRouter } from "./routers/profile";
import { transferRouter } from "./routers/transfer";
import { dashboardRouter } from "./routers/dashboard";
import { notificationRouter } from "./routers/notification";
import { subletRouter } from "./routers/sublet";
import { renovationRouter } from "./routers/renovation";
import { disturbanceRouter } from "./routers/disturbance";
import { bookingRouter } from "./routers/booking";

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
  annualReport: annualReportRouter,
  audit: auditRouter,
  announcement: announcementRouter,
  member: memberRouter,
  motion: motionRouter,
  suggestion: suggestionRouter,
  voterRegistry: voterRegistryRouter,
  apartment: apartmentRouter,
  membership: membershipRouter,
  organization: organizationRouter,
  brfRules: brfRulesRouter,
  settings: settingsRouter,
  annualMeeting: annualMeetingRouter,
  meetingLive: meetingLiveRouter,
  document: documentRouter,
  profile: profileRouter,
  transfer: transferRouter,
  dashboard: dashboardRouter,
  notification: notificationRouter,
  sublet: subletRouter,
  renovation: renovationRouter,
  disturbance: disturbanceRouter,
  booking: bookingRouter,
});

export type AppRouter = typeof appRouter;
