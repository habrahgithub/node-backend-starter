#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REQUIRED_MAJOR=20
REQUIRED_MINOR=9
REQUIRED_PATCH=0

fail=0

print_check() {
  local status="$1"
  local msg="$2"
  echo "[$status] $msg"
}

parse_semver_triplet() {
  local v="$1"
  v="${v#v}"
  local major minor patch
  IFS='.' read -r major minor patch <<<"$v"
  echo "${major:-0} ${minor:-0} ${patch:-0}"
}

version_ge_required() {
  local major="$1" minor="$2" patch="$3"
  if (( major > REQUIRED_MAJOR )); then return 0; fi
  if (( major < REQUIRED_MAJOR )); then return 1; fi
  if (( minor > REQUIRED_MINOR )); then return 0; fi
  if (( minor < REQUIRED_MINOR )); then return 1; fi
  if (( patch >= REQUIRED_PATCH )); then return 0; fi
  return 1
}

check_current_node() {
  local node_v
  node_v="$(node -v 2>/dev/null || true)"
  if [[ -z "$node_v" ]]; then
    print_check "FAIL" "Node runtime not found in PATH."
    fail=1
    return
  fi
  read -r major minor patch < <(parse_semver_triplet "$node_v")
  if version_ge_required "$major" "$minor" "$patch"; then
    print_check "PASS" "Current Node runtime $node_v satisfies >=${REQUIRED_MAJOR}.${REQUIRED_MINOR}.${REQUIRED_PATCH}."
  else
    print_check "FAIL" "Current Node runtime $node_v does not satisfy >=${REQUIRED_MAJOR}.${REQUIRED_MINOR}.${REQUIRED_PATCH}."
    fail=1
  fi
}

check_required_pin() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    print_check "FAIL" "Missing runtime pin file: $file"
    fail=1
    return
  fi
  local pin
  pin="$(tr -d ' \t\r\n' < "$file")"
  read -r major minor patch < <(parse_semver_triplet "$pin")
  if version_ge_required "$major" "$minor" "$patch"; then
    print_check "PASS" "Pin $file=$pin satisfies >=${REQUIRED_MAJOR}.${REQUIRED_MINOR}.${REQUIRED_PATCH}."
  else
    print_check "FAIL" "Pin $file=$pin does not satisfy >=${REQUIRED_MAJOR}.${REQUIRED_MINOR}.${REQUIRED_PATCH}."
    fail=1
  fi
}

check_dashboard_engine() {
  local f="vault/dashboard/package.json"
  if [[ ! -f "$f" ]]; then
    print_check "FAIL" "Missing $f."
    fail=1
    return
  fi
  if rg -q '"node"\s*:\s*">=20\.9\.0"' "$f"; then
    print_check "PASS" "Dashboard engines.node contract is >=20.9.0."
  else
    print_check "FAIL" "Dashboard engines.node contract must be >=20.9.0 in $f."
    fail=1
  fi
}

check_nvmrc_major_alignment() {
  local mismatches=()
  while IFS= read -r file; do
    local pin major minor patch
    pin="$(tr -d ' \t\r\n' < "$file")"
    read -r major minor patch < <(parse_semver_triplet "$pin")
    if [[ ! "$major" =~ ^[0-9]+$ ]]; then
      mismatches+=("$file=$pin")
      continue
    fi
    if (( major != REQUIRED_MAJOR )); then
      mismatches+=("$file=$pin")
    fi
  done < <(find . -name .nvmrc -not -path "*/node_modules/*" -not -path "./.git/*" | sort)

  if (( ${#mismatches[@]} == 0 )); then
    print_check "PASS" "All discovered .nvmrc pins align to major ${REQUIRED_MAJOR}."
  else
    print_check "FAIL" "Detected .nvmrc major drift:"
    for m in "${mismatches[@]}"; do
      echo "  - $m"
    done
    fail=1
  fi
}

echo "Runtime Contract Check"
echo "Required Node: >=${REQUIRED_MAJOR}.${REQUIRED_MINOR}.${REQUIRED_PATCH}"
check_current_node
check_required_pin ".nvmrc"
check_required_pin "vault/dashboard/.nvmrc"
check_dashboard_engine
check_nvmrc_major_alignment

if (( fail != 0 )); then
  echo "Runtime contract: FAIL"
  exit 1
fi

echo "Runtime contract: PASS"
