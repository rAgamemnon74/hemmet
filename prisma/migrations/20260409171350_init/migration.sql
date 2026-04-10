-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BOARD_CHAIRPERSON', 'BOARD_SECRETARY', 'BOARD_TREASURER', 'BOARD_PROPERTY_MGR', 'BOARD_ENVIRONMENT', 'BOARD_EVENTS', 'BOARD_SUBSTITUTE', 'BOARD_MEMBER', 'AUDITOR', 'MEMBER', 'RESIDENT');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ApplicantType" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "ApartmentType" AS ENUM ('APARTMENT', 'COMMERCIAL', 'GARAGE', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('BOARD', 'ANNUAL', 'EXTRAORDINARY');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('SIMPLE_MAJORITY', 'QUALIFIED_MAJORITY', 'UNANIMOUS', 'SHOW_OF_HANDS', 'BALLOT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'PROXY');

-- CreateEnum
CREATE TYPE "VoterRegistryMethod" AS ENUM ('DIGITAL', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ProxyType" AS ENUM ('MEMBER', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "DecisionMethod" AS ENUM ('ACCLAMATION', 'ROLL_CALL', 'COUNTED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'WAITING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "MotionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'RECEIVED', 'BOARD_RESPONSE', 'DECIDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AudienceScope" AS ENUM ('ALL', 'MEMBERS_ONLY', 'BOARD_ONLY');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('MEETING_PROTOCOL', 'MEETING_ATTACHMENT', 'EXPENSE_RECEIPT', 'MOTION_ATTACHMENT', 'DAMAGE_REPORT_PHOTO', 'ANNUAL_REPORT', 'FINANCIAL_STATEMENT', 'AUDIT_REPORT', 'ORGANIZATION_MANDATE', 'RULES', 'OTHER');

-- CreateEnum
CREATE TYPE "AnnualReportStatus" AS ENUM ('DRAFT', 'REVIEW', 'REVISED', 'APPROVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AuditRecommendation" AS ENUM ('APPROVE', 'APPROVE_WITH_REMARKS', 'DENY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "apartmentId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "postalCode" TEXT,
    "propertyDesignation" TEXT,
    "constructionYear" INTEGER,
    "totalArea" DOUBLE PRECISION,
    "plotArea" DOUBLE PRECISION,
    "commercialUnits" INTEGER,
    "heatingType" TEXT,
    "taxationValue" DOUBLE PRECISION,
    "energyRating" TEXT,
    "energyDeclarationExpiry" TIMESTAMP(3),

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apartment" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floor" INTEGER,
    "area" DOUBLE PRECISION,
    "rooms" DOUBLE PRECISION,
    "share" DOUBLE PRECISION,
    "monthlyFee" DOUBLE PRECISION,
    "buildingId" TEXT NOT NULL,
    "objectNumber" TEXT,
    "type" "ApartmentType" NOT NULL DEFAULT 'APARTMENT',
    "balcony" BOOLEAN NOT NULL DEFAULT false,
    "patio" BOOLEAN NOT NULL DEFAULT false,
    "storage" TEXT,
    "parking" TEXT,
    "acquiredAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgNumber" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationRepresentative" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personalId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "OrganizationRepresentative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMandate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "documentSize" INTEGER,
    "mimeType" TEXT,
    "description" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,

    CONSTRAINT "OrganizationMandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApartmentOwnership" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "ownerType" "OwnerType" NOT NULL DEFAULT 'PERSON',
    "userId" TEXT,
    "organizationId" TEXT,
    "ownershipShare" DOUBLE PRECISION NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferredAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "ApartmentOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipApplication" (
    "id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "applicantType" "ApplicantType" NOT NULL DEFAULT 'PERSON',
    "apartmentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "applicantUserId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "personalId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "organizationId" TEXT,
    "organizationName" TEXT,
    "organizationOrgNr" TEXT,
    "ownershipShare" DOUBLE PRECISION NOT NULL,
    "transferFrom" TEXT,
    "transferPrice" DOUBLE PRECISION,
    "transferDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "boardNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "calledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "meetingChairpersonId" TEXT,
    "meetingSecretaryId" TEXT,
    "adjusters" TEXT[],

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "presenter" TEXT,
    "voteType" "VoteType",

    CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendance" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "proxyFor" TEXT,
    "arrivedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "MeetingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterRegistry" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "method" "VoterRegistryMethod" NOT NULL DEFAULT 'DIGITAL',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoterRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterRegistryEntry" (
    "id" TEXT NOT NULL,
    "voterRegistryId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "representedBy" TEXT,
    "votingShares" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoterRegistryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingProxy" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "proxyType" "ProxyType" NOT NULL,
    "proxyMemberId" TEXT,
    "externalName" TEXT,
    "externalPersonalId" TEXT,
    "externalAddress" TEXT,
    "externalPhone" TEXT,
    "externalEmail" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredBy" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "MeetingProxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Protocol" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT[],
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "isProxy" BOOLEAN NOT NULL DEFAULT false,
    "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "agendaItemId" TEXT,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "decisionText" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "DecisionMethod" NOT NULL DEFAULT 'ACCLAMATION',
    "voteRequestedBy" TEXT,
    "voteRequestedReason" TEXT,
    "votesFor" INTEGER,
    "votesAgainst" INTEGER,
    "votesAbstained" INTEGER,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionVote" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "voterName" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "decisionId" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "approverId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "accountingRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motion" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proposal" TEXT NOT NULL,
    "boardResponse" TEXT,
    "status" "MotionStatus" NOT NULL DEFAULT 'DRAFT',
    "meetingId" TEXT,
    "resolution" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "apartmentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'NORMAL',
    "status" "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DamageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportComment" (
    "id" TEXT NOT NULL,
    "damageReportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scope" "AudienceScope" NOT NULL DEFAULT 'ALL',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestPayload" JSONB,
    "responseCode" INTEGER,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualReport" (
    "id" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "boardMembers" TEXT NOT NULL,
    "activities" TEXT NOT NULL,
    "maintenance" TEXT,
    "economy" TEXT,
    "futureOutlook" TEXT,
    "status" "AnnualReportStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "annualReportId" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'PENDING',
    "statement" TEXT,
    "recommendation" "AuditRecommendation",
    "findings" TEXT,
    "financialReview" TEXT,
    "boardReview" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrfSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "orgNumber" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3),
    "seat" TEXT,
    "signatoryRule" TEXT,
    "signatories" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "fiscalYearStart" INTEGER NOT NULL DEFAULT 1,
    "fiscalYearEnd" INTEGER NOT NULL DEFAULT 12,
    "bankgiro" TEXT,
    "plusgiro" TEXT,
    "bankAccount" TEXT,
    "swish" TEXT,
    "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "fTax" BOOLEAN NOT NULL DEFAULT false,
    "propertyManager" TEXT,
    "insuranceCompany" TEXT,
    "insurancePolicy" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "logoUrl" TEXT,
    "stadgarUrl" TEXT,
    "ordningsreglerUrl" TEXT,
    "memberFeeAccountNr" TEXT,

    CONSTRAINT "BrfSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DamageReportPhotos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DamageReportPhotos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MeetingDocuments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MeetingDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExpenseDocuments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExpenseDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MotionDocuments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MotionDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_buildingId_number_key" ON "Apartment"("buildingId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_orgNumber_key" ON "Organization"("orgNumber");

-- CreateIndex
CREATE INDEX "OrganizationRepresentative_organizationId_idx" ON "OrganizationRepresentative"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMandate_organizationId_idx" ON "OrganizationMandate"("organizationId");

-- CreateIndex
CREATE INDEX "ApartmentOwnership_apartmentId_idx" ON "ApartmentOwnership"("apartmentId");

-- CreateIndex
CREATE INDEX "ApartmentOwnership_userId_idx" ON "ApartmentOwnership"("userId");

-- CreateIndex
CREATE INDEX "ApartmentOwnership_organizationId_idx" ON "ApartmentOwnership"("organizationId");

-- CreateIndex
CREATE INDEX "AgendaItem_meetingId_idx" ON "AgendaItem"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttendance_meetingId_userId_key" ON "MeetingAttendance"("meetingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VoterRegistry_meetingId_key" ON "VoterRegistry"("meetingId");

-- CreateIndex
CREATE INDEX "VoterRegistryEntry_voterRegistryId_idx" ON "VoterRegistryEntry"("voterRegistryId");

-- CreateIndex
CREATE UNIQUE INDEX "VoterRegistryEntry_voterRegistryId_memberId_key" ON "VoterRegistryEntry"("voterRegistryId", "memberId");

-- CreateIndex
CREATE INDEX "MeetingProxy_meetingId_idx" ON "MeetingProxy"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingProxy_meetingId_memberId_key" ON "MeetingProxy"("meetingId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Protocol_meetingId_key" ON "Protocol"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_agendaItemId_userId_key" ON "Vote"("agendaItemId", "userId");

-- CreateIndex
CREATE INDEX "Decision_reference_idx" ON "Decision"("reference");

-- CreateIndex
CREATE INDEX "DecisionVote_decisionId_idx" ON "DecisionVote"("decisionId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionVote_decisionId_voterId_key" ON "DecisionVote"("decisionId", "voterId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_provider_key" ON "IntegrationConfig"("provider");

-- CreateIndex
CREATE INDEX "IntegrationLog_provider_createdAt_idx" ON "IntegrationLog"("provider", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualReport_fiscalYear_key" ON "AnnualReport"("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "Audit_annualReportId_key" ON "Audit"("annualReportId");

-- CreateIndex
CREATE INDEX "Audit_auditorId_idx" ON "Audit"("auditorId");

-- CreateIndex
CREATE INDEX "_DamageReportPhotos_B_index" ON "_DamageReportPhotos"("B");

-- CreateIndex
CREATE INDEX "_MeetingDocuments_B_index" ON "_MeetingDocuments"("B");

-- CreateIndex
CREATE INDEX "_ExpenseDocuments_B_index" ON "_ExpenseDocuments"("B");

-- CreateIndex
CREATE INDEX "_MotionDocuments_B_index" ON "_MotionDocuments"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationRepresentative" ADD CONSTRAINT "OrganizationRepresentative_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMandate" ADD CONSTRAINT "OrganizationMandate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApartmentOwnership" ADD CONSTRAINT "ApartmentOwnership_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApartmentOwnership" ADD CONSTRAINT "ApartmentOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApartmentOwnership" ADD CONSTRAINT "ApartmentOwnership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipApplication" ADD CONSTRAINT "MembershipApplication_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipApplication" ADD CONSTRAINT "MembershipApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterRegistry" ADD CONSTRAINT "VoterRegistry_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterRegistryEntry" ADD CONSTRAINT "VoterRegistryEntry_voterRegistryId_fkey" FOREIGN KEY ("voterRegistryId") REFERENCES "VoterRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingProxy" ADD CONSTRAINT "MeetingProxy_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Protocol" ADD CONSTRAINT "Protocol_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionVote" ADD CONSTRAINT "DecisionVote_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motion" ADD CONSTRAINT "Motion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motion" ADD CONSTRAINT "Motion_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportComment" ADD CONSTRAINT "ReportComment_damageReportId_fkey" FOREIGN KEY ("damageReportId") REFERENCES "DamageReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportComment" ADD CONSTRAINT "ReportComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_annualReportId_fkey" FOREIGN KEY ("annualReportId") REFERENCES "AnnualReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DamageReportPhotos" ADD CONSTRAINT "_DamageReportPhotos_A_fkey" FOREIGN KEY ("A") REFERENCES "DamageReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DamageReportPhotos" ADD CONSTRAINT "_DamageReportPhotos_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingDocuments" ADD CONSTRAINT "_MeetingDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingDocuments" ADD CONSTRAINT "_MeetingDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExpenseDocuments" ADD CONSTRAINT "_ExpenseDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExpenseDocuments" ADD CONSTRAINT "_ExpenseDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MotionDocuments" ADD CONSTRAINT "_MotionDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MotionDocuments" ADD CONSTRAINT "_MotionDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "Motion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
