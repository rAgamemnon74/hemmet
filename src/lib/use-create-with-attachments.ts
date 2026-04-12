import { trpc } from "@/lib/trpc";
import type { PendingAttachment } from "@/components/attachment-input";

/**
 * After creating an entity, submit all pending attachments.
 * Call this in onSuccess of the create mutation.
 */
export function useAttachmentSubmitter() {
  const addAttachment = trpc.attachment.add.useMutation();

  async function submitAttachments(
    entityType: string,
    entityId: string,
    attachments: PendingAttachment[],
  ) {
    for (const att of attachments) {
      await addAttachment.mutateAsync({
        entityType: entityType as never,
        entityId,
        type: att.type,
        name: att.name,
        url: att.url,
      });
    }
  }

  return { submitAttachments, isPending: addAttachment.isPending };
}
