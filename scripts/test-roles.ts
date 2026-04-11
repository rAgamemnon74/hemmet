/**
 * Functional test: verify each role can access their expected endpoints.
 * Run: npx tsx scripts/test-roles.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = "http://localhost:3000";

type TestResult = { role: string; test: string; status: "PASS" | "FAIL"; detail?: string };
const results: TestResult[] = [];

async function getSessionCookie(email: string): Promise<string> {
  // Get CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfData = await csrfRes.json() as { csrfToken: string };
  const cookies = csrfRes.headers.getSetCookie?.() ?? [];

  // Sign in
  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email,
      password: "password123",
    }),
    redirect: "manual",
  });

  const sessionCookies = signInRes.headers.getSetCookie?.() ?? [];
  const allCookies = [...cookies, ...sessionCookies].join("; ");
  return allCookies;
}

async function testEndpoint(
  role: string,
  testName: string,
  cookie: string,
  path: string,
  expectStatus: number = 200,
): Promise<void> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    const pass = res.status === expectStatus || (expectStatus === 200 && res.status < 400);
    results.push({
      role,
      test: testName,
      status: pass ? "PASS" : "FAIL",
      detail: `HTTP ${res.status}${pass ? "" : ` (expected ${expectStatus})`}`,
    });
  } catch (err) {
    results.push({ role, test: testName, status: "FAIL", detail: String(err) });
  }
}

async function testTrpc(
  role: string,
  testName: string,
  cookie: string,
  procedure: string,
  input?: Record<string, unknown>,
  expectOk: boolean = true,
): Promise<void> {
  try {
    const encodedInput = input ? encodeURIComponent(JSON.stringify({ "0": { json: input } })) : encodeURIComponent(JSON.stringify({ "0": { json: null } }));
    const url = `${BASE}/api/trpc/${procedure}?batch=1&input=${encodedInput}`;
    const res = await fetch(url, { headers: { Cookie: cookie } });
    const data = await res.json() as Array<{ result?: { data?: unknown }; error?: { message?: string } }>;
    const hasResult = data?.[0]?.result !== undefined;
    const hasError = data?.[0]?.error !== undefined;
    const pass = expectOk ? hasResult : hasError;
    results.push({
      role,
      test: testName,
      status: pass ? "PASS" : "FAIL",
      detail: hasError ? `Error: ${data[0].error?.message?.substring(0, 80)}` : "OK",
    });
  } catch (err) {
    results.push({ role, test: testName, status: "FAIL", detail: String(err) });
  }
}

async function main() {
  console.log("Starting functional tests for all roles...\n");

  const testUsers = [
    { email: "ordforande@hemmet.se", role: "Ordförande" },
    { email: "sekreterare@hemmet.se", role: "Sekreterare" },
    { email: "kassor@hemmet.se", role: "Kassör" },
    { email: "forvaltning@hemmet.se", role: "Fastighetsansvarig" },
    { email: "ledamot@hemmet.se", role: "Ledamot" },
    { email: "suppleant@hemmet.se", role: "Suppleant" },
    { email: "revisor@hemmet.se", role: "Revisor" },
    { email: "medlem@hemmet.se", role: "Medlem" },
    { email: "boende@hemmet.se", role: "Boende" },
  ];

  for (const user of testUsers) {
    console.log(`Testing: ${user.role} (${user.email})`);
    let cookie: string;
    try {
      cookie = await getSessionCookie(user.email);
      results.push({ role: user.role, test: "Login", status: "PASS" });
    } catch (err) {
      results.push({ role: user.role, test: "Login", status: "FAIL", detail: String(err) });
      continue;
    }

    // Core pages
    await testEndpoint(user.role, "Dashboard", cookie, "/");
    await testEndpoint(user.role, "Min sida", cookie, "/min-sida");

    // Profile API
    await testTrpc(user.role, "profile.get", cookie, "profile.get");
    await testTrpc(user.role, "profile.getMyIssues", cookie, "profile.getMyIssues");

    // Board-specific
    if (["Ordförande", "Sekreterare", "Kassör", "Fastighetsansvarig", "Ledamot"].includes(user.role)) {
      await testTrpc(user.role, "meeting.list", cookie, "meeting.list");
      await testTrpc(user.role, "decision.list", cookie, "decision.list");
      await testTrpc(user.role, "expense.list", cookie, "expense.list");
      await testTrpc(user.role, "task.list", cookie, "task.list");
      await testTrpc(user.role, "member.list", cookie, "member.list");
      await testTrpc(user.role, "dashboard.boardOverview", cookie, "dashboard.boardOverview");
      await testTrpc(user.role, "announcement.list", cookie, "announcement.list");
    }

    // Ordförande-specific
    if (user.role === "Ordförande") {
      await testTrpc(user.role, "dashboard.chairpersonOverview", cookie, "dashboard.chairpersonOverview");
      await testTrpc(user.role, "transfer.list", cookie, "transfer.list");
      await testTrpc(user.role, "membership.listApplications", cookie, "membership.listApplications");
    }

    // Kassör-specific
    if (user.role === "Kassör") {
      await testTrpc(user.role, "dashboard.treasurerOverview", cookie, "dashboard.treasurerOverview");
      await testTrpc(user.role, "transfer.list", cookie, "transfer.list");
    }

    // Fastighetsansvarig-specific
    if (user.role === "Fastighetsansvarig") {
      await testTrpc(user.role, "dashboard.propertyOverview", cookie, "dashboard.propertyOverview");
      await testTrpc(user.role, "damageReport.list", cookie, "damageReport.list");
      await testTrpc(user.role, "property.listComponents", cookie, "property.listComponents");
      await testTrpc(user.role, "property.listInspections", cookie, "property.listInspections");
      await testTrpc(user.role, "property.listContractors", cookie, "property.listContractors");
    }

    // Suppleant
    if (user.role === "Suppleant") {
      await testTrpc(user.role, "meeting.list", cookie, "meeting.list");
      await testTrpc(user.role, "announcement.list", cookie, "announcement.list");
      // Should NOT be able to create meetings
      await testTrpc(user.role, "meeting.create (should fail)", cookie, "meeting.create", { title: "Test", type: "BOARD", scheduledAt: new Date().toISOString() }, false);
    }

    // Revisor
    if (user.role === "Revisor") {
      await testTrpc(user.role, "annualReport.list", cookie, "annualReport.list");
      await testTrpc(user.role, "meeting.list", cookie, "meeting.list");
      await testTrpc(user.role, "expense.list", cookie, "expense.list");
      await testTrpc(user.role, "member.list", cookie, "member.list");
    }

    // Medlem
    if (user.role === "Medlem") {
      await testTrpc(user.role, "motion.list", cookie, "motion.list");
      await testTrpc(user.role, "suggestion.list", cookie, "suggestion.list");
      await testTrpc(user.role, "damageReport.list", cookie, "damageReport.list");
      await testTrpc(user.role, "annualMeeting.list", cookie, "annualMeeting.list");
      await testTrpc(user.role, "booking.listResources", cookie, "booking.listResources");
      // Should NOT see board meetings
      await testTrpc(user.role, "meeting.list (should fail)", cookie, "meeting.list", undefined, false);
    }

    // Boende
    if (user.role === "Boende") {
      await testTrpc(user.role, "damageReport.list", cookie, "damageReport.list");
      await testTrpc(user.role, "suggestion.list", cookie, "suggestion.list");
      await testTrpc(user.role, "booking.listResources", cookie, "booking.listResources");
      // Should NOT see motions
      await testTrpc(user.role, "motion.list (should fail)", cookie, "motion.list", undefined, false);
      // Should NOT see member registry
      await testTrpc(user.role, "member.list (should fail)", cookie, "member.list", undefined, false);
    }

    console.log(`  ${results.filter(r => r.role === user.role && r.status === "PASS").length} passed, ${results.filter(r => r.role === user.role && r.status === "FAIL").length} failed`);
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("RESULTS");
  console.log("=".repeat(70));

  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;

  for (const r of results) {
    const icon = r.status === "PASS" ? "✓" : "✗";
    console.log(`  ${icon} [${r.role}] ${r.test}${r.status === "FAIL" ? ` — ${r.detail}` : ""}`);
  }

  console.log(`\n${passed} passed, ${failed} failed out of ${results.length} tests`);

  await db.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main();
