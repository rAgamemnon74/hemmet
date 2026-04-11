#!/bin/bash
# Functional test: verify each role can access their expected endpoints.
# Usage: bash scripts/test-roles.sh

BASE="http://localhost:3000"
PASS=0
FAIL=0
TOTAL=0

green() { echo -e "\033[32m✓\033[0m $1"; }
red() { echo -e "\033[31m✗\033[0m $1"; }

login() {
  local email=$1
  local jar="/tmp/hemmet-test-${email}.txt"
  rm -f "$jar"

  # Get CSRF
  curl -s -c "$jar" "${BASE}/api/auth/csrf" > /tmp/hemmet-csrf.json 2>/dev/null
  local csrf=$(grep -o '"csrfToken":"[^"]*"' /tmp/hemmet-csrf.json | cut -d'"' -f4)

  # Login
  curl -s -c "$jar" -b "$jar" -X POST \
    "${BASE}/api/auth/callback/credentials" \
    -d "csrfToken=${csrf}&email=${email}&password=password123" \
    -o /dev/null 2>/dev/null

  echo "$jar"
}

test_trpc() {
  local role=$1
  local name=$2
  local jar=$3
  local proc=$4
  local expect_ok=${5:-true}

  TOTAL=$((TOTAL + 1))
  local input='%7B%220%22%3A%7B%7D%7D'
  local res=$(curl -s -b "$jar" "${BASE}/api/trpc/${proc}?batch=1&input=${input}" 2>/dev/null)

  local has_result=$(echo "$res" | tr -d '\n' | grep -c '"result"')
  local has_error=$(echo "$res" | tr -d '\n' | grep -c '"error"')

  if [ "$expect_ok" = "true" ]; then
    if [ "$has_result" -gt 0 ]; then
      green "[${role}] ${name}"
      PASS=$((PASS + 1))
    else
      local err_msg=$(echo "$res" | tr -d '\n' | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4)
      red "[${role}] ${name} — ${err_msg:-HTML response (no session)}"
      FAIL=$((FAIL + 1))
    fi
  else
    if [ "$has_error" -gt 0 ]; then
      green "[${role}] ${name} (correctly denied)"
      PASS=$((PASS + 1))
    else
      red "[${role}] ${name} — should have been denied but wasn't"
      FAIL=$((FAIL + 1))
    fi
  fi
}

test_page() {
  local role=$1
  local name=$2
  local jar=$3
  local path=$4

  TOTAL=$((TOTAL + 1))
  local status=$(curl -s -o /dev/null -w "%{http_code}" -b "$jar" "${BASE}${path}" 2>/dev/null)

  if [ "$status" -lt 400 ]; then
    green "[${role}] ${name} (HTTP ${status})"
    PASS=$((PASS + 1))
  else
    red "[${role}] ${name} (HTTP ${status})"
    FAIL=$((FAIL + 1))
  fi
}

echo "Functional tests for all roles"
echo "=============================="
echo ""

# --- ORDFÖRANDE ---
echo "--- Ordförande ---"
JAR=$(login "ordforande@hemmet.se")
test_page "Ordförande" "Dashboard" "$JAR" "/"
test_page "Ordförande" "Min sida" "$JAR" "/min-sida"
test_trpc "Ordförande" "profile.get" "$JAR" "profile.get"
test_trpc "Ordförande" "profile.getMyIssues" "$JAR" "profile.getMyIssues"
test_trpc "Ordförande" "meeting.list" "$JAR" "meeting.list"
test_trpc "Ordförande" "decision.list" "$JAR" "decision.list"
test_trpc "Ordförande" "expense.list" "$JAR" "expense.list"
test_trpc "Ordförande" "member.list" "$JAR" "member.list"
test_trpc "Ordförande" "transfer.list" "$JAR" "transfer.list"
test_trpc "Ordförande" "dashboard.boardOverview" "$JAR" "dashboard.boardOverview"
test_trpc "Ordförande" "dashboard.chairpersonOverview" "$JAR" "dashboard.chairpersonOverview"
test_trpc "Ordförande" "membership.listApplications" "$JAR" "membership.listApplications"
echo ""

# --- SEKRETERARE ---
echo "--- Sekreterare ---"
JAR=$(login "sekreterare@hemmet.se")
test_trpc "Sekreterare" "profile.get" "$JAR" "profile.get"
test_trpc "Sekreterare" "meeting.list" "$JAR" "meeting.list"
test_trpc "Sekreterare" "member.list" "$JAR" "member.list"
test_trpc "Sekreterare" "dashboard.boardOverview" "$JAR" "dashboard.boardOverview"
echo ""

# --- KASSÖR ---
echo "--- Kassör ---"
JAR=$(login "kassor@hemmet.se")
test_trpc "Kassör" "profile.get" "$JAR" "profile.get"
test_trpc "Kassör" "expense.list" "$JAR" "expense.list"
test_trpc "Kassör" "transfer.list" "$JAR" "transfer.list"
test_trpc "Kassör" "dashboard.treasurerOverview" "$JAR" "dashboard.treasurerOverview"
echo ""

# --- FASTIGHETSANSVARIG ---
echo "--- Fastighetsansvarig ---"
JAR=$(login "forvaltning@hemmet.se")
test_trpc "Fastighetsansv" "profile.get" "$JAR" "profile.get"
test_trpc "Fastighetsansv" "damageReport.list" "$JAR" "damageReport.list"
test_trpc "Fastighetsansv" "property.listComponents" "$JAR" "property.listComponents"
test_trpc "Fastighetsansv" "property.listInspections" "$JAR" "property.listInspections"
test_trpc "Fastighetsansv" "property.listContractors" "$JAR" "property.listContractors"
test_trpc "Fastighetsansv" "dashboard.propertyOverview" "$JAR" "dashboard.propertyOverview"
echo ""

# --- LEDAMOT ---
echo "--- Ledamot ---"
JAR=$(login "ledamot@hemmet.se")
test_trpc "Ledamot" "profile.get" "$JAR" "profile.get"
test_trpc "Ledamot" "meeting.list" "$JAR" "meeting.list"
test_trpc "Ledamot" "member.list" "$JAR" "member.list"
test_trpc "Ledamot" "dashboard.boardOverview" "$JAR" "dashboard.boardOverview"
echo ""

# --- SUPPLEANT ---
echo "--- Suppleant ---"
JAR=$(login "suppleant@hemmet.se")
test_trpc "Suppleant" "profile.get" "$JAR" "profile.get"
test_trpc "Suppleant" "meeting.list" "$JAR" "meeting.list"
test_trpc "Suppleant" "announcement.list" "$JAR" "announcement.list"
test_trpc "Suppleant" "expense.list" "$JAR" "expense.list"
echo ""

# --- REVISOR ---
echo "--- Revisor ---"
JAR=$(login "revisor@hemmet.se")
test_trpc "Revisor" "profile.get" "$JAR" "profile.get"
test_trpc "Revisor" "annualReport.list" "$JAR" "annualReport.list"
test_trpc "Revisor" "meeting.list" "$JAR" "meeting.list"
test_trpc "Revisor" "expense.list" "$JAR" "expense.list"
test_trpc "Revisor" "member.list" "$JAR" "member.list"
echo ""

# --- MEDLEM ---
echo "--- Medlem ---"
JAR=$(login "medlem@hemmet.se")
test_trpc "Medlem" "profile.get" "$JAR" "profile.get"
test_trpc "Medlem" "motion.list" "$JAR" "motion.list"
test_trpc "Medlem" "suggestion.list" "$JAR" "suggestion.list"
test_trpc "Medlem" "damageReport.list" "$JAR" "damageReport.list"
test_trpc "Medlem" "booking.listResources" "$JAR" "booking.listResources"
test_trpc "Medlem" "meeting.list (deny)" "$JAR" "meeting.list" "false"
test_trpc "Medlem" "member.list (deny)" "$JAR" "member.list" "false"
echo ""

# --- BOENDE ---
echo "--- Boende ---"
JAR=$(login "boende@hemmet.se")
test_trpc "Boende" "profile.get" "$JAR" "profile.get"
test_trpc "Boende" "damageReport.list" "$JAR" "damageReport.list"
test_trpc "Boende" "suggestion.list" "$JAR" "suggestion.list"
test_trpc "Boende" "booking.listResources" "$JAR" "booking.listResources"
test_trpc "Boende" "motion.list (deny)" "$JAR" "motion.list" "false"
test_trpc "Boende" "member.list (deny)" "$JAR" "member.list" "false"
test_trpc "Boende" "meeting.list (deny)" "$JAR" "meeting.list" "false"
echo ""

# Summary
echo "=============================="
echo "${PASS} passed, ${FAIL} failed out of ${TOTAL} tests"
[ "$FAIL" -eq 0 ] && echo "ALL TESTS PASSED" || echo "SOME TESTS FAILED"
