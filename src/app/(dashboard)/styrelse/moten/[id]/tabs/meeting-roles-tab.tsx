"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, PenLine, Scale } from "lucide-react";
import { trpc } from "@/lib/trpc";

type BoardMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Array<{ role: string }>;
};

export function MeetingRolesTab({
  meetingId,
  meetingChairpersonId,
  meetingSecretaryId,
  adjusters,
  boardMembers,
  canEdit,
}: {
  meetingId: string;
  meetingChairpersonId: string | null;
  meetingSecretaryId: string | null;
  adjusters: string[];
  boardMembers: BoardMember[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [chairperson, setChairperson] = useState(meetingChairpersonId ?? "");
  const [secretary, setSecretary] = useState(meetingSecretaryId ?? "");
  const [selectedAdjusters, setSelectedAdjusters] = useState<string[]>(adjusters);

  const updateMeeting = trpc.meeting.update.useMutation({
    onSuccess: () => router.refresh(),
  });

  function handleSave() {
    updateMeeting.mutate({
      id: meetingId,
      meetingChairpersonId: chairperson || null,
      meetingSecretaryId: secretary || null,
      adjusters: selectedAdjusters,
    });
  }

  function toggleAdjuster(userId: string) {
    setSelectedAdjusters((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  const getName = (userId: string) => {
    const m = boardMembers.find((b) => b.id === userId);
    return m ? `${m.firstName} ${m.lastName}` : "Okänd";
  };

  const hasChanges =
    chairperson !== (meetingChairpersonId ?? "") ||
    secretary !== (meetingSecretaryId ?? "") ||
    JSON.stringify(selectedAdjusters.sort()) !== JSON.stringify([...adjusters].sort());

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        Tilldela roller för detta specifika möte. Dessa kan skilja sig från
        styrelserollerna.
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
        {/* Mötesordförande */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gavel className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-900">
              Mötesordförande
            </label>
          </div>
          {canEdit ? (
            <select
              value={chairperson}
              onChange={(e) => setChairperson(e.target.value)}
              className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Ej tilldelad</option>
              {boardMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-700">
              {meetingChairpersonId ? getName(meetingChairpersonId) : "Ej tilldelad"}
            </p>
          )}
        </div>

        {/* Mötessekreterare */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <PenLine className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-900">
              Mötessekreterare
            </label>
          </div>
          {canEdit ? (
            <select
              value={secretary}
              onChange={(e) => setSecretary(e.target.value)}
              className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Ej tilldelad</option>
              {boardMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-700">
              {meetingSecretaryId ? getName(meetingSecretaryId) : "Ej tilldelad"}
            </p>
          )}
        </div>

        {/* Justeringsmän */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-900">
              Justeringsmän
            </label>
          </div>
          {canEdit ? (
            <div className="space-y-2 max-w-md">
              {boardMembers.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAdjusters.includes(m.id)}
                    onChange={() => toggleAdjuster(m.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {m.firstName} {m.lastName}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {adjusters.length > 0 ? (
                adjusters.map((id) => (
                  <p key={id} className="text-sm text-gray-700">
                    {getName(id)}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-500">Inga justeringsmän valda</p>
              )}
            </div>
          )}
        </div>
      </div>

      {canEdit && hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateMeeting.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMeeting.isPending ? "Sparar..." : "Spara mötesroller"}
          </button>
        </div>
      )}
    </div>
  );
}
