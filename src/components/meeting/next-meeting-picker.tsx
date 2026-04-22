"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfISOWeek, endOfISOWeek,
  addDays, addMonths, subMonths, format, getISOWeek, isSameMonth, isSameDay, isBefore,
} from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_HEADERS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

function buildMonthGrid(month: Date): Date[][] {
  // Starta från måndagen i den vecka som första dagen i månaden ligger, sluta vid söndagen i sista veckan
  const start = startOfISOWeek(startOfMonth(month));
  const end = endOfISOWeek(endOfMonth(month));
  const weeks: Date[][] = [];
  let cursor = start;
  while (cursor <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function formatProposedSwedish(d: Date): string {
  const weekday = format(d, "EEEE", { locale: sv });
  const date = format(d, "yyyy-MM-dd");
  const time = format(d, "HH:mm");
  return `${weekday}, ${date} med start ${time}`;
}

type Props = {
  value: Date | null;
  onChange?: (value: Date | null) => void;
  onInsertToNotes?: (text: string) => void;
  readOnly?: boolean;
  minDate?: Date;          // default: idag — användaren bör inte föreslå ett datum i det förflutna
  dark?: boolean;          // Mörkt tema för presentation
};

export function NextMeetingPicker({ value, onChange, onInsertToNotes, readOnly = false, minDate, dark = false }: Props) {
  // Start visa månad = månaden för värdet, annars nuvarande månad
  const [viewMonth, setViewMonth] = useState<Date>(value ? startOfMonth(value) : startOfMonth(new Date()));
  const effectiveMin = minDate ?? new Date();

  const weeks = useMemo(() => buildMonthGrid(viewMonth), [viewMonth.getTime()]);

  // Klockslag separeras från datum för pickern
  const [hour, setHour] = useState<number>(value ? value.getHours() : 19);
  const [minute, setMinute] = useState<number>(value ? value.getMinutes() : 0);

  function selectDate(day: Date) {
    if (readOnly) return;
    if (isBefore(day, effectiveMin) && !isSameDay(day, effectiveMin)) return;
    const next = new Date(day);
    next.setHours(hour, minute, 0, 0);
    onChange?.(next);
  }

  function updateTime(h: number, m: number) {
    setHour(h);
    setMinute(m);
    if (value) {
      const next = new Date(value);
      next.setHours(h, m, 0, 0);
      onChange?.(next);
    }
  }

  const palette = dark
    ? {
        card: "bg-gray-800 border-gray-700",
        text: "text-gray-100",
        mutedText: "text-gray-400",
        subtle: "text-gray-500",
        headerBtn: "text-gray-300 hover:bg-gray-700",
        weekNr: "text-gray-500 bg-gray-900/40 border-gray-700",
        dayHeader: "text-gray-400",
        dayBase: "border-gray-700",
        dayThisMonth: "text-gray-200",
        dayOtherMonth: "text-gray-600",
        dayDisabled: "text-gray-700 cursor-not-allowed",
        daySelected: "bg-blue-600 text-white font-semibold",
        dayHover: "hover:bg-gray-700",
        today: "ring-1 ring-blue-400",
        propCard: "bg-blue-900/30 border-blue-700 text-blue-100",
        timeInput: "bg-gray-900 border-gray-700 text-gray-100",
      }
    : {
        card: "bg-white border-gray-200",
        text: "text-gray-900",
        mutedText: "text-gray-500",
        subtle: "text-gray-400",
        headerBtn: "text-gray-500 hover:bg-gray-100",
        weekNr: "text-gray-400 bg-gray-50 border-gray-100",
        dayHeader: "text-gray-400",
        dayBase: "border-gray-100",
        dayThisMonth: "text-gray-800",
        dayOtherMonth: "text-gray-300",
        dayDisabled: "text-gray-200 cursor-not-allowed",
        daySelected: "bg-blue-600 text-white font-semibold",
        dayHover: "hover:bg-blue-50",
        today: "ring-1 ring-blue-400",
        propCard: "bg-blue-50 border-blue-200 text-blue-900",
        timeInput: "bg-white border-gray-300 text-gray-800",
      };

  return (
    <div className={cn("rounded-lg border p-4 space-y-3", palette.card)}>
      {/* Header: månadsnavigation */}
      <div className="flex items-center justify-between">
        <h3 className={cn("text-xs font-semibold uppercase flex items-center gap-1.5", palette.mutedText)}>
          <CalendarDays className="h-4 w-4" />
          Föreslaget datum och tid för nästa möte
        </h3>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className={cn("rounded p-1.5", palette.headerBtn)} title="Föregående månad">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setViewMonth(startOfMonth(new Date()))}
              className={cn("rounded px-2 py-0.5 text-xs", palette.headerBtn)} title="Idag">
              Idag
            </button>
            <button type="button" onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className={cn("rounded p-1.5", palette.headerBtn)} title="Nästa månad">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className={cn("text-sm font-medium", palette.text)}>
        {format(viewMonth, "MMMM yyyy", { locale: sv })}
      </div>

      {/* Vecko-tabell */}
      <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-700" style={{ border: undefined }}>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className={cn("w-8 border-r px-1 py-1 text-center font-medium", palette.weekNr)}>v</th>
              {DAY_HEADERS.map((d) => (
                <th key={d} className={cn("border-r px-1 py-1 text-center font-medium", palette.dayHeader, palette.dayBase)}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => {
              const weekNo = getISOWeek(week[0]);
              return (
                <tr key={week[0].toISOString()}>
                  <td className={cn("border-r border-t px-1 py-1.5 text-center font-mono", palette.weekNr, palette.dayBase)}>
                    {weekNo}
                  </td>
                  {week.map((day) => {
                    const isOther = !isSameMonth(day, viewMonth);
                    const isSelected = value && isSameDay(day, value);
                    const disabled = isBefore(day, effectiveMin) && !isSameDay(day, effectiveMin);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <td key={day.toISOString()}
                        className={cn("border-r border-t p-0", palette.dayBase)}>
                        <button type="button"
                          disabled={readOnly || disabled}
                          onClick={() => selectDate(day)}
                          className={cn(
                            "w-full py-1.5 text-center transition-colors",
                            isSelected ? palette.daySelected :
                            disabled ? palette.dayDisabled :
                            isOther ? palette.dayOtherMonth : palette.dayThisMonth,
                            !isSelected && !disabled && !readOnly && palette.dayHover,
                            isToday && !isSelected && palette.today,
                          )}
                        >
                          {format(day, "d")}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tidsväljare */}
      {!readOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className={cn("text-xs font-medium", palette.mutedText)}>Tid:</label>
          <select value={hour} onChange={(e) => updateTime(parseInt(e.target.value), minute)}
            className={cn("rounded border px-2 py-1 text-xs", palette.timeInput)}>
            {Array.from({ length: 24 }, (_, i) => i).map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
            ))}
          </select>
          <span className={palette.mutedText}>:</span>
          <select value={minute} onChange={(e) => updateTime(hour, parseInt(e.target.value))}
            className={cn("rounded border px-2 py-1 text-xs", palette.timeInput)}>
            {[0, 15, 30, 45].map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
          {value && (
            <button type="button" onClick={() => onChange?.(null)}
              className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs", palette.headerBtn)}
              title="Rensa val">
              <X className="h-3 w-3" /> Rensa
            </button>
          )}
        </div>
      )}

      {/* Summering + kopiera-knapp */}
      {value ? (
        <div className={cn("flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm", palette.propCard)}>
          <span>
            <strong>Föreslaget datum och tid:</strong> {formatProposedSwedish(value)}
          </span>
          {!readOnly && onInsertToNotes && (
            <button type="button"
              onClick={() => onInsertToNotes(`Föreslaget datum och tid: ${formatProposedSwedish(value)}.`)}
              className="inline-flex items-center gap-1 rounded bg-white/10 hover:bg-white/20 px-2 py-1 text-xs whitespace-nowrap"
              title="Lägg till i anteckningar">
              <Copy className="h-3 w-3" /> Kopiera till anteckningar
            </button>
          )}
        </div>
      ) : (
        <p className={cn("text-xs italic", palette.subtle)}>
          Inget datum valt. {readOnly ? "Ordföranden väljer under mötet." : "Klicka på en dag i kalendern."}
        </p>
      )}
    </div>
  );
}
