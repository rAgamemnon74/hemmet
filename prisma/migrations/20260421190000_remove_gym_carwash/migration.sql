-- AlterEnum: remove GYM and CAR_WASH from ResourceType
BEGIN;
CREATE TYPE "ResourceType_new" AS ENUM ('LAUNDRY', 'SAUNA', 'GUEST_APARTMENT', 'PARTY_ROOM', 'PARKING', 'HOBBY_ROOM', 'OTHER');
ALTER TABLE "BookableResource" ALTER COLUMN "type" TYPE "ResourceType_new" USING ("type"::text::"ResourceType_new");
DROP TYPE "ResourceType";
ALTER TYPE "ResourceType_new" RENAME TO "ResourceType";
COMMIT;
