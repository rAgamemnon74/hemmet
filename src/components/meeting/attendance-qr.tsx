"use client";

import { QRCodeSVG } from "qrcode.react";
import { Link2 } from "lucide-react";

/**
 * QR code + link for self-registration of attendance.
 * Used in admin and presentation views during OPENING / ATTENDANCE agenda items.
 */
export function AttendanceQR({
  meetingId,
  variant = "light",
}: {
  meetingId: string;
  variant?: "light" | "dark";
}) {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/narvaro/${meetingId}`;
  const isDark = variant === "dark";

  return (
    <div className={`rounded-xl border p-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <h3 className={`text-xs font-semibold uppercase mb-4 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        Registrera närvaro
      </h3>
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG value={url} size={isDark ? 200 : 160} level="M" />
        </div>
        <div className="flex items-center gap-1.5">
          <Link2 className={`h-3.5 w-3.5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs font-mono break-all ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
          >
            {url}
          </a>
        </div>
        <p className={`text-xs text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}>
          Skanna QR-koden eller klicka på länken för att registrera din närvaro.
        </p>
      </div>
    </div>
  );
}
