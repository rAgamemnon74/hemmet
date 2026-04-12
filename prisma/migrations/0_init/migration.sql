warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BOARD_CHAIRPERSON', 'BOARD_SECRETARY', 'BOARD_TREASURER', 'BOARD_PROPERTY_MGR', 'BOARD_ENVIRONMENT', 'BOARD_EVENTS', 'BOARD_SUBSTITUTE', 'BOARD_MEMBER', 'AUDITOR', 'AUDITOR_SUBSTITUTE', 'NOMINATING_COMMITTEE', 'NOMINATING_COMMITTEE_CHAIR', 'MEMBER', 'RESIDENT');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ApplicantType" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "ApartmentType" AS ENUM ('APARTMENT', 'COMMERCIAL', 'GARAGE', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('SALE', 'PRIVATE_SALE', 'INHERITANCE', 'DIVORCE_SETTLEMENT', 'GIFT', 'FORCED_SALE', 'SHARE_CHANGE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('INITIATED', 'MEMBERSHIP_REVIEW', 'APPROVED', 'REJECTED', 'APPEALED', 'FINANCIAL_SETTLEMENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('BOARD', 'ANNUAL', 'EXTRAORDINARY');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'FINALIZING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AgendaItemType" AS ENUM ('OPENING', 'ATTENDANCE', 'QUORUM_CHECK', 'ELECT_CHAIR', 'ELECT_SECRETARY', 'ELECT_ADJUSTERS', 'AUDIT_REPORT', 'DISCHARGE_VOTE', 'BOARD_ELECTION', 'SUBSTITUTE_ELECTION', 'AUDITOR_ELECTION', 'ELECT_NOMINATING_COMMITTEE', 'MEMBERSHIP_REVIEW', 'MOTIONS', 'BOARD_MATTERS');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('SIMPLE_MAJORITY', 'QUALIFIED_MAJORITY', 'UNANIMOUS', 'SHOW_OF_HANDS', 'BALLOT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'PROXY');

-- CreateEnum
CREATE TYPE "VoterRegistryMethod" AS ENUM ('DIGITAL', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ProxyType" AS ENUM ('MEMBER', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('DRAFT', 'FINALIZED', 'SIGNED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DecisionMethod" AS ENUM ('ACCLAMATION', 'ROLL_CALL', 'COUNTED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'WAITING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "MotionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'RECEIVED', 'BOARD_RESPONSE', 'DECIDED', 'WITHDRAWN', 'STRUCK', 'NOT_TREATED');

-- CreateEnum
CREATE TYPE "MotionRecommendation" AS ENUM ('APPROVE', 'REJECT', 'AMEND', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "MotionProposalSource" AS ENUM ('MOTIONER', 'BOARD', 'AMENDMENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SubletStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "RenovationStatus" AS ENUM ('SUBMITTED', 'TECHNICAL_REVIEW', 'BOARD_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'INSPECTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RenovationType" AS ENUM ('KITCHEN', 'BATHROOM', 'FLOORING', 'WALLS', 'ELECTRICAL', 'PLUMBING', 'VENTILATION', 'BALCONY', 'OTHER');

-- CreateEnum
CREATE TYPE "DisturbanceStatus" AS ENUM ('REPORTED', 'ACKNOWLEDGED', 'FIRST_WARNING', 'SECOND_WARNING', 'BOARD_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisturbanceType" AS ENUM ('NOISE', 'SMOKE', 'THREATS', 'PROPERTY_DAMAGE', 'COMMON_AREA_MISUSE', 'PETS', 'WASTE', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('LAUNDRY', 'SAUNA', 'GUEST_APARTMENT', 'PARTY_ROOM', 'GYM', 'OTHER');

-- CreateEnum
CREATE TYPE "NominationPeriodStatus" AS ENUM ('PLANNING', 'OPEN', 'CLOSED', 'PRESENTED');

-- CreateEnum
CREATE TYPE "NominationPosition" AS ENUM ('CHAIRPERSON', 'BOARD_MEMBER', 'BOARD_SUBSTITUTE', 'AUDITOR', 'AUDITOR_SUBSTITUTE');

-- CreateEnum
CREATE TYPE "NominationStatus" AS ENUM ('PROPOSED', 'CONTACTED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'ELECTED', 'NOT_ELECTED');

-- CreateEnum
CREATE TYPE "ComponentCondition" AS ENUM ('GOOD', 'FAIR', 'POOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComponentCategory" AS ENUM ('ROOF', 'FACADE', 'WINDOWS', 'PLUMBING', 'ELECTRICAL', 'VENTILATION', 'ELEVATOR', 'BALCONY', 'FOUNDATION', 'DRAINAGE', 'HEATING', 'COMMON_AREAS', 'PARKING', 'OUTDOOR', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('OVK', 'ELEVATOR', 'FIRE_SAFETY', 'ENERGY', 'RADON', 'PLAYGROUND', 'CISTERN', 'COMPONENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('APPROVED', 'APPROVED_WITH_REMARKS', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "AudienceScope" AS ENUM ('ALL', 'MEMBERS_ONLY', 'BOARD_ONLY');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('MEETING_PROTOCOL', 'MEETING_ATTACHMENT', 'EXPENSE_RECEIPT', 'MOTION_ATTACHMENT', 'DAMAGE_REPORT_PHOTO', 'ANNUAL_REPORT', 'FINANCIAL_STATEMENT', 'AUDIT_REPORT', 'ORGANIZATION_MANDATE', 'RULES', 'OTHER');

-- CreateEnum
CREATE TYPE "AnnualReportStatus" AS ENUM ('DRAFT', 'FINAL_UPLOADED', 'SIGNED', 'REVIEW', 'REVISED', 'APPROVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AuditRecommendation" AS ENUM ('APPROVE', 'APPROVE_WITH_REMARKS', 'DENY');

-- CreateEnum
CREATE TYPE "OrganizationAffiliation" AS ENUM ('NONE', 'HSB', 'RIKSBYGGEN', 'SBC', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('CONTACT_SHARING', 'DIGITAL_COMMUNICATION', 'PHOTO_PUBLICATION');

-- CreateEnum
CREATE TYPE "PersonalDataAction" AS ENUM ('VIEW_REGISTRY', 'VIEW_MEMBER_DETAIL', 'VIEW_APPLICATION', 'VIEW_SSN', 'EXPORT_CSV', 'VIEW_PROXY_DETAILS', 'VIEW_ORGANIZATION_REPS');

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
    "exitedAt" TIMESTAMP(3),
    "exitReason" TEXT,
    "exitDocumentId" TEXT,
    "estateContactName" TEXT,
    "estateContactPersonalId" TEXT,
    "estateContactPhone" TEXT,
    "estateContactEmail" TEXT,
    "estateContactRelation" TEXT,
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
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "propertyDesignation" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "postalCode" TEXT,
    "plotArea" DOUBLE PRECISION,
    "taxationValue" DOUBLE PRECISION,
    "commercialUnits" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "constructionYear" INTEGER,
    "totalArea" DOUBLE PRECISION,
    "heatingType" TEXT,
    "energyRating" TEXT,
    "energyDeclarationExpiry" TIMESTAMP(3),
    "excludedComponentCategories" TEXT[],

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
CREATE TABLE "TransferCase" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "type" "TransferType" NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'INITIATED',
    "sellerId" TEXT,
    "buyerApplicationId" TEXT,
    "externalContactName" TEXT,
    "externalContactEmail" TEXT,
    "externalContactPhone" TEXT,
    "transferPrice" DOUBLE PRECISION,
    "transferFeeAmount" DOUBLE PRECISION,
    "transferFeePaidBy" TEXT,
    "transferFeePaidAt" TIMESTAMP(3),
    "pledgeFeeAmount" DOUBLE PRECISION,
    "outstandingDebt" DOUBLE PRECISION,
    "contractDate" TIMESTAMP(3),
    "accessDate" TIMESTAMP(3),
    "decisionDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "creditCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "creditCheckDate" TIMESTAMP(3),
    "financingVerified" BOOLEAN NOT NULL DEFAULT false,
    "financingVerifiedDate" TIMESTAMP(3),
    "statuteCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "decisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TransferCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MortgageNotation" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "transferCaseId" TEXT,
    "bankName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "notationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "denotationDate" TIMESTAMP(3),
    "fee" DOUBLE PRECISION,
    "feePaidAt" TIMESTAMP(3),
    "requestedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MortgageNotation_pkey" PRIMARY KEY ("id")
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
    "activeAgendaItemId" TEXT,
    "activeSubItemType" TEXT,
    "activeSubItemId" TEXT,

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
    "specialType" "AgendaItemType",
    "notes" TEXT,

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
    "status" "ProtocolStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT[],
    "finalizedAt" TIMESTAMP(3),
    "finalizedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
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
    "tiebrokenByChairperson" BOOLEAN NOT NULL DEFAULT false,
    "participantIds" TEXT[],

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionRecusal" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionRecusal_pkey" PRIMARY KEY ("id")
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
    "boardRecommendation" "MotionRecommendation",
    "status" "MotionStatus" NOT NULL DEFAULT 'DRAFT',
    "meetingId" TEXT,
    "resolution" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotionVoteProposal" (
    "id" TEXT NOT NULL,
    "motionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "source" "MotionProposalSource" NOT NULL DEFAULT 'MOTIONER',
    "votesFor" INTEGER,
    "votesAgainst" INTEGER,
    "votesAbstained" INTEGER,
    "adopted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MotionVoteProposal_pkey" PRIMARY KEY ("id")
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
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "assignedTo" TEXT,
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
CREATE TABLE "SubletApplication" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "status" "SubletStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantEmail" TEXT,
    "tenantPhone" TEXT,
    "subletFeeAmount" DOUBLE PRECISION,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "boardNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubletApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenovationApplication" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "status" "RenovationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "type" "RenovationType" NOT NULL,
    "description" TEXT NOT NULL,
    "affectsStructure" BOOLEAN NOT NULL DEFAULT false,
    "affectsPlumbing" BOOLEAN NOT NULL DEFAULT false,
    "affectsElectrical" BOOLEAN NOT NULL DEFAULT false,
    "affectsVentilation" BOOLEAN NOT NULL DEFAULT false,
    "plannedStartDate" TIMESTAMP(3),
    "plannedEndDate" TIMESTAMP(3),
    "estimatedCost" DOUBLE PRECISION,
    "technicalAssessment" TEXT,
    "technicalAssessedBy" TEXT,
    "technicalAssessedAt" TIMESTAMP(3),
    "conditions" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "inspectionResult" TEXT,
    "inspectedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenovationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisturbanceCase" (
    "id" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "status" "DisturbanceStatus" NOT NULL DEFAULT 'REPORTED',
    "type" "DisturbanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "targetApartmentId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "firstWarningAt" TIMESTAMP(3),
    "firstWarningBy" TEXT,
    "secondWarningAt" TIMESTAMP(3),
    "secondWarningBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisturbanceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookableResource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "maxDurationHours" INTEGER NOT NULL DEFAULT 3,
    "advanceBookingDays" INTEGER NOT NULL DEFAULT 14,
    "rulesText" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookableResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NominationPeriod" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "status" "NominationPeriodStatus" NOT NULL DEFAULT 'PLANNING',
    "chairpersonId" TEXT,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "presentedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NominationPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nomination" (
    "id" TEXT NOT NULL,
    "nominationPeriodId" TEXT NOT NULL,
    "position" "NominationPosition" NOT NULL,
    "candidateId" TEXT,
    "candidateName" TEXT NOT NULL,
    "status" "NominationStatus" NOT NULL DEFAULT 'PROPOSED',
    "source" TEXT NOT NULL DEFAULT 'COMMITTEE',
    "motivation" TEXT,
    "competenceAreas" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberNomination" (
    "id" TEXT NOT NULL,
    "nominationPeriodId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "candidateId" TEXT,
    "candidateName" TEXT,
    "position" "NominationPosition" NOT NULL,
    "motivation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberNomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictOfInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedEntity" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "ConflictOfInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditQuestion" (
    "id" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "subject" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingComponent" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "category" "ComponentCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "installYear" INTEGER,
    "expectedLifespan" INTEGER,
    "condition" "ComponentCondition" NOT NULL DEFAULT 'GOOD',
    "lastInspectedAt" TIMESTAMP(3),
    "nextActionYear" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "componentId" TEXT,
    "type" "InspectionType" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "result" "InspectionResult" NOT NULL DEFAULT 'PENDING',
    "inspector" TEXT,
    "certificateUrl" TEXT,
    "nextDueAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgNumber" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "category" TEXT NOT NULL,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "contractUrl" TEXT,
    "pubAgreement" BOOLEAN NOT NULL DEFAULT false,
    "pubAgreementDate" TIMESTAMP(3),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
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
    "storedName" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "description" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "visibleToMembers" BOOLEAN NOT NULL DEFAULT false,
    "visibleToAll" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
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
    "finalPdfUrl" TEXT,
    "finalPdfName" TEXT,
    "finalUploadedAt" TIMESTAMP(3),
    "finalUploadedBy" TEXT,
    "signedBy" TEXT[],
    "signedAt" TIMESTAMP(3),
    "allSigned" BOOLEAN NOT NULL DEFAULT false,

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
CREATE TABLE "BrfRules" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "affiliation" "OrganizationAffiliation" NOT NULL DEFAULT 'NONE',
    "reservedBoardSeats" INTEGER NOT NULL DEFAULT 0,
    "reservedBoardSubstitutes" INTEGER NOT NULL DEFAULT 0,
    "reservedAuditorSeats" INTEGER NOT NULL DEFAULT 0,
    "requireOrgApprovalForStatuteChange" BOOLEAN NOT NULL DEFAULT false,
    "minBoardMembers" INTEGER NOT NULL DEFAULT 3,
    "maxBoardMembers" INTEGER NOT NULL DEFAULT 7,
    "maxBoardSubstitutes" INTEGER NOT NULL DEFAULT 3,
    "allowExternalBoardMembers" INTEGER NOT NULL DEFAULT 0,
    "noticePeriodMinWeeks" INTEGER NOT NULL DEFAULT 2,
    "noticePeriodMaxWeeks" INTEGER NOT NULL DEFAULT 6,
    "noticeMethodDigital" BOOLEAN NOT NULL DEFAULT false,
    "allowDigitalMeeting" BOOLEAN NOT NULL DEFAULT false,
    "maxProxiesPerPerson" INTEGER NOT NULL DEFAULT 1,
    "proxyCircleRestriction" BOOLEAN NOT NULL DEFAULT false,
    "proxyMaxValidityMonths" INTEGER NOT NULL DEFAULT 12,
    "blankVoteExcluded" BOOLEAN NOT NULL DEFAULT true,
    "secretBallotOnDemand" BOOLEAN NOT NULL DEFAULT true,
    "tieBreakerChairperson" BOOLEAN NOT NULL DEFAULT true,
    "tieBreakerLotteryForElection" BOOLEAN NOT NULL DEFAULT true,
    "adjustersCount" INTEGER NOT NULL DEFAULT 2,
    "separateVoteCounters" BOOLEAN NOT NULL DEFAULT false,
    "agendaTemplateId" TEXT,
    "motionDeadlineMonth" INTEGER NOT NULL DEFAULT 2,
    "motionDeadlineDay" INTEGER NOT NULL DEFAULT 1,
    "expenseApprovalMaxAmount" DOUBLE PRECISION,
    "expenseSelfApprovalBlocked" BOOLEAN NOT NULL DEFAULT true,
    "transferFeeMaxPercent" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "pledgeFeeMaxPercent" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "subletFeeMaxPercent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "transferFeePaidBySeller" BOOLEAN NOT NULL DEFAULT false,
    "minAuditors" INTEGER NOT NULL DEFAULT 1,
    "maxAuditors" INTEGER NOT NULL DEFAULT 2,
    "maxAuditorSubstitutes" INTEGER NOT NULL DEFAULT 2,
    "requireAuthorizedAuditor" BOOLEAN NOT NULL DEFAULT false,
    "maintenancePlanRequired" BOOLEAN NOT NULL DEFAULT true,
    "maintenancePlanYears" INTEGER NOT NULL DEFAULT 30,
    "maintenanceFundPercent" DOUBLE PRECISION,
    "protocolDeadlineWeeks" INTEGER NOT NULL DEFAULT 3,
    "maxOwnershipPercent" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "prisbasbelopp" INTEGER NOT NULL DEFAULT 57300,
    "transferDecisionDeadlineWeeks" INTEGER NOT NULL DEFAULT 4,
    "subletRequiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "nominatingCommitteeSize" INTEGER NOT NULL DEFAULT 3,
    "nominationPeriodWeeks" INTEGER NOT NULL DEFAULT 8,
    "nominationDeadlineBeforeMeeting" INTEGER NOT NULL DEFAULT 4,
    "allowSelfNomination" BOOLEAN NOT NULL DEFAULT true,
    "allowMemberNomination" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrfRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalDataAccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "PersonalDataAction" NOT NULL,
    "targetUserId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalDataAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT,
    "before" TEXT,
    "after" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Building_propertyId_idx" ON "Building"("propertyId");

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
CREATE UNIQUE INDEX "TransferCase_buyerApplicationId_key" ON "TransferCase"("buyerApplicationId");

-- CreateIndex
CREATE INDEX "TransferCase_apartmentId_idx" ON "TransferCase"("apartmentId");

-- CreateIndex
CREATE INDEX "TransferCase_status_idx" ON "TransferCase"("status");

-- CreateIndex
CREATE INDEX "TransferCase_sellerId_idx" ON "TransferCase"("sellerId");

-- CreateIndex
CREATE INDEX "MortgageNotation_apartmentId_idx" ON "MortgageNotation"("apartmentId");

-- CreateIndex
CREATE INDEX "MortgageNotation_transferCaseId_idx" ON "MortgageNotation"("transferCaseId");

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
CREATE INDEX "DecisionRecusal_decisionId_idx" ON "DecisionRecusal"("decisionId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionRecusal_decisionId_userId_key" ON "DecisionRecusal"("decisionId", "userId");

-- CreateIndex
CREATE INDEX "DecisionVote_decisionId_idx" ON "DecisionVote"("decisionId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionVote_decisionId_voterId_key" ON "DecisionVote"("decisionId", "voterId");

-- CreateIndex
CREATE INDEX "MotionVoteProposal_motionId_idx" ON "MotionVoteProposal"("motionId");

-- CreateIndex
CREATE INDEX "SubletApplication_apartmentId_idx" ON "SubletApplication"("apartmentId");

-- CreateIndex
CREATE INDEX "SubletApplication_applicantId_idx" ON "SubletApplication"("applicantId");

-- CreateIndex
CREATE INDEX "SubletApplication_status_idx" ON "SubletApplication"("status");

-- CreateIndex
CREATE INDEX "RenovationApplication_apartmentId_idx" ON "RenovationApplication"("apartmentId");

-- CreateIndex
CREATE INDEX "RenovationApplication_applicantId_idx" ON "RenovationApplication"("applicantId");

-- CreateIndex
CREATE INDEX "RenovationApplication_status_idx" ON "RenovationApplication"("status");

-- CreateIndex
CREATE INDEX "DisturbanceCase_reportedById_idx" ON "DisturbanceCase"("reportedById");

-- CreateIndex
CREATE INDEX "DisturbanceCase_status_idx" ON "DisturbanceCase"("status");

-- CreateIndex
CREATE INDEX "DisturbanceCase_targetApartmentId_idx" ON "DisturbanceCase"("targetApartmentId");

-- CreateIndex
CREATE INDEX "Booking_resourceId_startTime_idx" ON "Booking"("resourceId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NominationPeriod_meetingId_key" ON "NominationPeriod"("meetingId");

-- CreateIndex
CREATE INDEX "Nomination_nominationPeriodId_idx" ON "Nomination"("nominationPeriodId");

-- CreateIndex
CREATE INDEX "Nomination_position_idx" ON "Nomination"("position");

-- CreateIndex
CREATE INDEX "MemberNomination_nominationPeriodId_idx" ON "MemberNomination"("nominationPeriodId");

-- CreateIndex
CREATE INDEX "ConflictOfInterest_userId_idx" ON "ConflictOfInterest"("userId");

-- CreateIndex
CREATE INDEX "AuditQuestion_auditorId_idx" ON "AuditQuestion"("auditorId");

-- CreateIndex
CREATE INDEX "BuildingComponent_buildingId_idx" ON "BuildingComponent"("buildingId");

-- CreateIndex
CREATE INDEX "BuildingComponent_category_idx" ON "BuildingComponent"("category");

-- CreateIndex
CREATE INDEX "Inspection_buildingId_idx" ON "Inspection"("buildingId");

-- CreateIndex
CREATE INDEX "Inspection_type_idx" ON "Inspection"("type");

-- CreateIndex
CREATE INDEX "Inspection_nextDueAt_idx" ON "Inspection"("nextDueAt");

-- CreateIndex
CREATE INDEX "Contractor_category_idx" ON "Contractor"("category");

-- CreateIndex
CREATE INDEX "Contractor_active_idx" ON "Contractor"("active");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

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
CREATE INDEX "UserConsent_userId_idx" ON "UserConsent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserConsent_userId_type_key" ON "UserConsent"("userId", "type");

-- CreateIndex
CREATE INDEX "PersonalDataAccessLog_userId_idx" ON "PersonalDataAccessLog"("userId");

-- CreateIndex
CREATE INDEX "PersonalDataAccessLog_targetUserId_idx" ON "PersonalDataAccessLog"("targetUserId");

-- CreateIndex
CREATE INDEX "PersonalDataAccessLog_createdAt_idx" ON "PersonalDataAccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

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
ALTER TABLE "Building" ADD CONSTRAINT "Building_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_buyerApplicationId_fkey" FOREIGN KEY ("buyerApplicationId") REFERENCES "MembershipApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MortgageNotation" ADD CONSTRAINT "MortgageNotation_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MortgageNotation" ADD CONSTRAINT "MortgageNotation_transferCaseId_fkey" FOREIGN KEY ("transferCaseId") REFERENCES "TransferCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MortgageNotation" ADD CONSTRAINT "MortgageNotation_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "DecisionRecusal" ADD CONSTRAINT "DecisionRecusal_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "MotionVoteProposal" ADD CONSTRAINT "MotionVoteProposal_motionId_fkey" FOREIGN KEY ("motionId") REFERENCES "Motion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "SubletApplication" ADD CONSTRAINT "SubletApplication_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubletApplication" ADD CONSTRAINT "SubletApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenovationApplication" ADD CONSTRAINT "RenovationApplication_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenovationApplication" ADD CONSTRAINT "RenovationApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisturbanceCase" ADD CONSTRAINT "DisturbanceCase_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisturbanceCase" ADD CONSTRAINT "DisturbanceCase_targetApartmentId_fkey" FOREIGN KEY ("targetApartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "BookableResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NominationPeriod" ADD CONSTRAINT "NominationPeriod_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_nominationPeriodId_fkey" FOREIGN KEY ("nominationPeriodId") REFERENCES "NominationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberNomination" ADD CONSTRAINT "MemberNomination_nominationPeriodId_fkey" FOREIGN KEY ("nominationPeriodId") REFERENCES "NominationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConflictOfInterest" ADD CONSTRAINT "ConflictOfInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditQuestion" ADD CONSTRAINT "AuditQuestion_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingComponent" ADD CONSTRAINT "BuildingComponent_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "BuildingComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_annualReportId_fkey" FOREIGN KEY ("annualReportId") REFERENCES "AnnualReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

