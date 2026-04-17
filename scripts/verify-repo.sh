#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

failures=0

pass() {
  printf 'PASS: %s\n' "$1"
}

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

expect_file() {
  local path="$1"
  if [[ -f "$path" ]]; then
    pass "required file exists: $path"
  else
    fail "missing required file: $path"
  fi
}

check_plan_dir() {
  local dir="$1"
  local kind="$2"
  local required=(brief.md plan.md progress.md)
  local missing=()

  for file in "${required[@]}"; do
    [[ -f "$dir/$file" ]] || missing+=("$file")
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    pass "$kind exec plan complete: ${dir#docs/exec-plans/}"
  else
    fail "$kind exec plan missing files (${missing[*]}): ${dir#docs/exec-plans/}"
  fi
}

check_numbered_plan_dirs() {
  local -A seen=()
  local bucket dir base prefix label

  for bucket in active completed; do
    while IFS= read -r dir; do
      base="$(basename "$dir")"

      if [[ "$bucket" == "active" && "$base" == "_template" ]]; then
        continue
      fi

      if [[ ! "$base" =~ ^([0-9]{3})\.[a-z0-9][a-z0-9.-]*$ ]]; then
        fail "invalid exec plan slug: docs/exec-plans/$bucket/$base"
        continue
      fi

      prefix="${BASH_REMATCH[1]}"
      label="docs/exec-plans/$bucket/$base"
      if [[ -n "${seen[$prefix]:-}" ]]; then
        fail "duplicate exec plan prefix $prefix: $label vs ${seen[$prefix]}"
      else
        seen[$prefix]="$label"
        pass "unique exec plan prefix $prefix: $label"
      fi
    done < <(find "docs/exec-plans/$bucket" -mindepth 1 -maxdepth 1 -type d | sort)
  done
}

check_markdown_links() {
  local output

  if ! output="$(python3 - <<'PY'
import re
import sys
from collections import defaultdict
from pathlib import Path

root = Path.cwd().resolve()
repo_name = root.name
skip_dirs = {'.git', '.omx', '.next', 'node_modules', 'build', '.gradle', 'playwright-report', 'test-results'}
md_files = sorted(path for path in root.rglob('*.md') if not any(part in skip_dirs for part in path.relative_to(root).parts))
link_pattern = re.compile(r'!?\[[^\]]*\]\(([^)]+)\)')
heading_pattern = re.compile(r'^(#{1,6})\s+(.*)$')
skip_prefixes = ('http://', 'https://', 'mailto:', 'tel:', 'data:')


def slugify(text: str) -> str:
    text = re.sub(r'`([^`]*)`', r'\1', text.strip().lower())
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'[^\w\-\s가-힣]', '', text, flags=re.UNICODE)
    text = re.sub(r'\s+', '-', text).strip('-')
    return text


def build_anchor_map(path: Path):
    counts = defaultdict(int)
    anchors = set()
    for line in path.read_text(encoding='utf-8').splitlines():
        match = heading_pattern.match(line)
        if not match:
            continue
        slug = slugify(match.group(2))
        if not slug:
            continue
        count = counts[slug]
        anchor = slug if count == 0 else f"{slug}-{count}"
        counts[slug] += 1
        anchors.add(anchor)
    return anchors

anchor_cache = {}


def normalize_target(source: Path, raw_target: str):
    target = raw_target.strip()
    if not target:
        return None, None, None
    if target.startswith('<') and target.endswith('>'):
        target = target[1:-1].strip()
    if target.startswith(skip_prefixes):
        return None, None, None

    file_part, _, anchor = target.partition('#')
    if not file_part:
        return source, anchor, target

    candidate = None
    if file_part.startswith('/'):
        repo_marker = f'/{repo_name}/'
        if repo_marker in file_part:
            relative = file_part.split(repo_marker, 1)[1]
            candidate = root / relative
        elif file_part == f'/{repo_name}':
            candidate = root
        else:
            candidate = root / file_part.lstrip('/')
    else:
        candidate = (source.parent / file_part).resolve()

    return candidate, anchor, target


errors = []
checked = 0
for md in md_files:
    rel_md = md.relative_to(root)
    text = md.read_text(encoding='utf-8')
    for line_no, line in enumerate(text.splitlines(), start=1):
        for match in link_pattern.finditer(line):
            raw_target = match.group(1).strip()
            resolved, anchor, display = normalize_target(md, raw_target)
            if resolved is None:
                continue
            checked += 1
            try:
                resolved.relative_to(root)
            except ValueError:
                errors.append(f"{rel_md}:{line_no}: link escapes repo root -> {display}")
                continue

            if not resolved.exists():
                errors.append(f"{rel_md}:{line_no}: missing target -> {display}")
                continue

            if anchor:
                if resolved.is_dir():
                    errors.append(f"{rel_md}:{line_no}: directory target cannot have anchor -> {display}")
                    continue
                anchors = anchor_cache.setdefault(resolved, build_anchor_map(resolved))
                if anchor not in anchors:
                    errors.append(f"{rel_md}:{line_no}: missing anchor #{anchor} in {(resolved.relative_to(root))} -> {display}")

if errors:
    print('\n'.join(errors))
    sys.exit(1)

print(f"checked {checked} markdown link target(s)")
PY
)"; then
    while IFS= read -r line; do
      [[ -n "$line" ]] && fail "markdown link: $line"
    done <<< "$output"
  else
    pass "$output"
  fi
}

required_files=(
  AGENTS.md
  README.md
  CONSTITUTION.md
  ARCHITECTURE.md
  backend/AGENTS.md
  frontend/AGENTS.md
  docs/REPOSITORY.md
  docs/REPO_MAP.md
  docs/CHANGE_POLICY.md
  docs/INTERFACE_MATRIX.md
  docs/ENVIRONMENTS.md
  docs/PLANS.md
  docs/QUALITY_SCORE.md
  docs/exec-plans/active/README.md
  docs/exec-plans/active/_template/brief.md
  docs/exec-plans/active/_template/plan.md
  docs/exec-plans/active/_template/progress.md
)

for path in "${required_files[@]}"; do
  expect_file "$path"
done

check_numbered_plan_dirs
check_markdown_links

while IFS= read -r dir; do
  base="$(basename "$dir")"
  [[ "$base" == "_template" ]] && continue
  check_plan_dir "$dir" "active"
done < <(find docs/exec-plans/active -mindepth 1 -maxdepth 1 -type d | sort)

while IFS= read -r dir; do
  check_plan_dir "$dir" "completed"
done < <(find docs/exec-plans/completed -mindepth 1 -maxdepth 1 -type d | sort)

if [[ $failures -gt 0 ]]; then
  printf '\nRepo verification failed with %d issue(s).\n' "$failures" >&2
  exit 1
fi

printf '\nRepo verification passed.\n'
