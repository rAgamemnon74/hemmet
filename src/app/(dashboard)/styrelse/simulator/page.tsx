"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Calculator, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Building2, Loader2, Info, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

export default function SimulatorPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];

  const [newCommercialIncome, setNewCommercialIncome] = useState(0);
  const [feeReductionPercent, setFeeReductionPercent] = useState(0);
  const [interestRateChange, setInterestRateChange] = useState(0);
  const [showPerApartment, setShowPerApartment] = useState(false);

  const { data, isLoading } = trpc.scenario.simulate.useQuery(
    { newCommercialIncome, feeReductionPercent, interestRateChange },
    { placeholderData: (prev) => prev }
  );

  if (isLoading && !data) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scenariosimulator</h1>
          <p className="text-sm text-gray-500">Simulera ekonomiska förändringar och se påverkan på äkta/oäkta-status</p>
        </div>
      </div>

      {/* ═══ REGLAGE ═══ */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-5">Scenarioparametrar</h2>

        <div className="space-y-6">
          {/* Nya kommersiella intäkter */}
          <SliderControl
            label="Nya externa intäkter (hyresavtal)"
            value={newCommercialIncome}
            onChange={setNewCommercialIncome}
            min={0}
            max={2000000}
            step={10000}
            format={(v) => `${(v / 1000).toLocaleString("sv-SE")} tkr/år`}
            description="T.ex. ny hyresgäst (ICA, Coop, förskola)"
          />

          {/* Avgiftssänkning */}
          <SliderControl
            label="Avgiftssänkning"
            value={feeReductionPercent}
            onChange={setFeeReductionPercent}
            min={0}
            max={50}
            step={1}
            format={(v) => `${v}%`}
            description="Sänkning av medlemsavgifterna"
          />

          {/* Ränteförändring */}
          <SliderControl
            label="Ränteförändring"
            value={interestRateChange}
            onChange={setInterestRateChange}
            min={-5}
            max={5}
            step={0.25}
            format={(v) => `${v > 0 ? "+" : ""}${v} procentenheter`}
            description="Förändring av låneräntan"
          />
        </div>
      </div>

      {data && (
        <>
          {/* ═══ STATUS-JÄMFÖRELSE ═══ */}
          <div className="grid gap-4 sm:grid-cols-2">
            <StatusCard
              title="Nuläge"
              isAkta={data.current.isAkta}
              externalRatio={data.current.externalRatio}
              totalIncome={data.current.totalIncome}
              fees={data.current.annualFees}
              commercial={data.current.commercialIncome}
            />
            <StatusCard
              title="Simulerat"
              isAkta={data.simulated.isAkta}
              externalRatio={data.simulated.externalRatio}
              totalIncome={data.simulated.totalIncome}
              fees={data.simulated.annualFees}
              commercial={data.simulated.commercialIncome}
              highlighted
              statusChanged={data.simulated.statusChanged}
            />
          </div>

          {/* ═══ STATUSVARNING ═══ */}
          {data.simulated.statusChanged && (
            <div className={cn(
              "rounded-lg border-2 p-4 flex items-start gap-3",
              data.simulated.isAkta
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50"
            )}>
              {data.simulated.isAkta ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {data.simulated.isAkta
                    ? "Föreningen blir äkta i detta scenario"
                    : "Varning: Föreningen blir oäkta i detta scenario"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {data.simulated.isAkta
                    ? "Externa intäkter understiger 40%-gränsen. Medlemmar behåller skattefördelarna."
                    : "Externa intäkter överstiger 40% av totala intäkter. Medlemmar förlorar 22/30-kvoten vid försäljning och kan bli beskattade för bostadsförmån."}
                </p>
              </div>
            </div>
          )}

          {/* ═══ 60/40-MÄTARE ═══ */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-4">60/40-kvot</h2>

            <div className="relative h-8 rounded-full bg-gray-100 overflow-hidden">
              {/* 40%-markering */}
              <div className="absolute left-[40%] top-0 bottom-0 w-0.5 bg-red-400 z-10" />
              <div className="absolute left-[40%] -top-5 text-xs text-red-500 font-medium -translate-x-1/2">40%</div>

              {/* Nuvarande */}
              <div
                className="absolute top-0 bottom-0 bg-blue-200 transition-all duration-300"
                style={{ width: `${Math.min(data.current.externalRatio, 100)}%` }}
              />

              {/* Simulerat */}
              <div
                className={cn(
                  "absolute top-0 bottom-0 transition-all duration-300",
                  data.simulated.isAkta ? "bg-green-400" : "bg-red-400"
                )}
                style={{ width: `${Math.min(data.simulated.externalRatio, 100)}%` }}
              />
            </div>

            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0% externa intäkter</span>
              <span className="font-medium">
                Simulerat: {data.simulated.externalRatio}%
                {data.current.externalRatio !== data.simulated.externalRatio && (
                  <span className="text-gray-400"> (nu: {data.current.externalRatio}%)</span>
                )}
              </span>
              <span>100%</span>
            </div>

            {/* Break-even */}
            <div className="mt-4 rounded-md bg-gray-50 p-3">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Break-even:</span>{" "}
                Max {data.breakEven.maxExternalIncome.toLocaleString("sv-SE")} kr/år i externa intäkter
                innan föreningen blir oäkta.
                {data.breakEven.headroom > 0 ? (
                  <span className="text-green-700"> Marginal: {data.breakEven.headroom.toLocaleString("sv-SE")} kr ({data.breakEven.headroomPercent}%)</span>
                ) : (
                  <span className="text-red-700"> Gränsen överskriden med {Math.abs(data.breakEven.headroom).toLocaleString("sv-SE")} kr</span>
                )}
              </p>
            </div>
          </div>

          {/* ═══ SKATTEKONSEKVENSER ═══ */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-4">Skattekonsekvenser</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-green-200 bg-green-50/50 p-4">
                <p className="text-xs font-semibold text-green-700 uppercase mb-2">Äkta (privatbostadsföretag)</p>
                <p className="text-xs text-gray-600">{data.taxImplications.aktaDescription}</p>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-xs text-gray-500">Skatt vid försäljning (500 tkr vinst)</p>
                  <p className="text-lg font-bold text-gray-900">{data.taxImplications.exampleSaleTax500k.akta.toLocaleString("sv-SE")} kr</p>
                </div>
              </div>

              <div className="rounded-md border border-red-200 bg-red-50/50 p-4">
                <p className="text-xs font-semibold text-red-700 uppercase mb-2">Oäkta (ej privatbostadsföretag)</p>
                <p className="text-xs text-gray-600">{data.taxImplications.oaktaDescription}</p>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs text-gray-500">Skatt vid försäljning (500 tkr vinst)</p>
                  <p className="text-lg font-bold text-gray-900">{data.taxImplications.exampleSaleTax500k.oakta.toLocaleString("sv-SE")} kr</p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
              <Info className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">
                Skillnad per medlem vid försäljning: <span className="font-semibold">{data.taxImplications.exampleSaleTax500k.difference.toLocaleString("sv-SE")} kr mer i skatt</span> om föreningen är oäkta (vid 500 tkr vinst).
              </p>
            </div>
          </div>

          {/* ═══ RÄNTEEFFEKT ═══ */}
          {interestRateChange !== 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Räntepåverkan</h2>
              <div className="flex items-center gap-3">
                {data.simulated.interestCostChange > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {data.simulated.interestCostChange > 0 ? "Ökad" : "Minskad"} räntekostnad:{" "}
                    {Math.abs(data.simulated.interestCostChange).toLocaleString("sv-SE")} kr/år
                  </p>
                  <p className="text-xs text-gray-500">
                    Baserat på schablonberäkning av föreningens lånestock
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PER LÄGENHET ═══ */}
          {data.perApartment.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase">Påverkan per lägenhet</h2>
                <button
                  onClick={() => setShowPerApartment(!showPerApartment)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showPerApartment ? "Dölj detaljer" : `Visa alla ${data.perApartment.length} lägenheter`}
                </button>
              </div>

              {/* Sammanfattning */}
              {feeReductionPercent > 0 && (
                <div className="mb-4 rounded-md bg-green-50 p-3">
                  <p className="text-sm text-green-800">
                    Genomsnittlig besparing: <span className="font-semibold">
                      {Math.round(data.perApartment.reduce((s, a) => s + a.monthlySaving, 0) / data.perApartment.length).toLocaleString("sv-SE")} kr/mån
                    </span> per lägenhet
                  </p>
                </div>
              )}

              {showPerApartment && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                        <th className="pb-2 pr-4">Lgh</th>
                        <th className="pb-2 pr-4 text-right">Yta</th>
                        <th className="pb-2 pr-4 text-right">Nuvarande</th>
                        <th className="pb-2 pr-4 text-right">Simulerad</th>
                        <th className="pb-2 pr-4 text-right">Besparing/mån</th>
                        {!data.simulated.isAkta && (
                          <>
                            <th className="pb-2 pr-4 text-right">Förmånsvärde</th>
                            <th className="pb-2 text-right">Skatteskillnad</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.perApartment.map((apt) => (
                        <tr key={apt.apartmentId} className="border-b border-gray-100">
                          <td className="py-2 pr-4 font-medium">{apt.number}</td>
                          <td className="py-2 pr-4 text-right text-gray-500">{apt.area ? `${apt.area} m²` : "–"}</td>
                          <td className="py-2 pr-4 text-right">{apt.currentMonthlyFee.toLocaleString("sv-SE")} kr</td>
                          <td className="py-2 pr-4 text-right">{Math.round(apt.simulatedMonthlyFee).toLocaleString("sv-SE")} kr</td>
                          <td className={cn("py-2 pr-4 text-right", apt.monthlySaving > 0 ? "text-green-600" : "text-gray-400")}>
                            {apt.monthlySaving > 0 ? `-${Math.round(apt.monthlySaving).toLocaleString("sv-SE")} kr` : "–"}
                          </td>
                          {!data.simulated.isAkta && (
                            <>
                              <td className="py-2 pr-4 text-right text-amber-600">
                                {apt.benefitValue > 0 ? `${Math.round(apt.benefitValue).toLocaleString("sv-SE")} kr/år` : "–"}
                              </td>
                              <td className="py-2 text-right text-red-600">
                                +{Math.round(apt.taxDifferenceOnSale).toLocaleString("sv-SE")} kr
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══ DISCLAIMER ═══ */}
          <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Observera:</span> Denna simulering är en förenklad modell baserad på schablonvärden.
              Den ersätter inte professionell ekonomisk rådgivning. 60/40-regeln bedöms av Skatteverket
              baserat på en helhetsbedömning, inte enbart på intäktskvoter. Ränteberäkningen bygger på
              en schablonmässig uppskattning av föreningens lånestock. Kontakta föreningens revisor
              eller ekonomisk rådgivare innan beslut fattas.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Slider-komponent ─────────────────────────────────────────

function SliderControl({ label, value, onChange, min, max, step, format, description }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  description?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="text-sm font-medium text-gray-900">{label}</label>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
        <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

// ─── Statuskort ───────────────────────────────────────────────

function StatusCard({ title, isAkta, externalRatio, totalIncome, fees, commercial, highlighted, statusChanged }: {
  title: string;
  isAkta: boolean;
  externalRatio: number;
  totalIncome: number;
  fees: number;
  commercial: number;
  highlighted?: boolean;
  statusChanged?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border p-5",
      highlighted
        ? statusChanged
          ? isAkta ? "border-green-300 bg-green-50/50" : "border-red-300 bg-red-50/50"
          : "border-blue-200 bg-blue-50/30"
        : "border-gray-200 bg-white"
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">{title}</h3>
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
          isAkta ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          {isAkta ? (
            <><CheckCircle2 className="h-3 w-3" /> Äkta</>
          ) : (
            <><AlertTriangle className="h-3 w-3" /> Oäkta</>
          )}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Avgiftsintäkter</span>
          <span className="font-medium">{fees.toLocaleString("sv-SE")} kr/år</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Externa intäkter</span>
          <span className="font-medium">{commercial.toLocaleString("sv-SE")} kr/år</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2">
          <span className="text-gray-500">Totalt</span>
          <span className="font-semibold">{totalIncome.toLocaleString("sv-SE")} kr/år</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Extern kvot</span>
          <span className={cn("font-semibold", externalRatio > 40 ? "text-red-600" : "text-green-600")}>
            {externalRatio}%
          </span>
        </div>
      </div>
    </div>
  );
}
