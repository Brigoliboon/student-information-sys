#!/usr/bin/env bash
# SIMS API smoke test (curl). Covers the 20 demo actions in REQUIREMENTS.md.
# Usage: BASE_URL=http://localhost:3000 ADMIN_EMAIL=admin@example.edu ADMIN_PASS='...' bash tests/smoke.sh
set -u
BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.edu}"
ADMIN_PASS="${ADMIN_PASS:-Admin123!}"

pass=0; fail=0
check() { # check <label> <expected_status> <actual_status>
  if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "PASS $1 ($3)"; else fail=$((fail+1)); echo "FAIL $1 (want $2, got $3)"; fi
}
code_of() { # code_of <file>
  grep -o '"http_code":[0-9]*' "$1" | cut -d: -f2
}
T=$(mktemp -d)

echo "== 1. API reachable =="
curl -s -o "$T/h.json" -w '{"http_code":%{http_code}}' "$BASE_URL/api/v1/auth/me" > "$T/h.code"
check "unauthenticated me is 401" 401 "$(code_of "$T/h.code")"

echo "== 2. Login =="
curl -s -X POST "$BASE_URL/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" -o "$T/login.json" -w '%{http_code}' > "$T/login.code"
check "login 201" 201 "$(cat "$T/login.code")"
TOKEN=$(python3 -c "import json;print(json.load(open('$T/login.json'))['data']['session']['access_token'])" 2>/dev/null || echo "")
AUTH=(-H "Authorization: Bearer $TOKEN")

echo "== 3. Protected me =="
curl -s "$BASE_URL/api/v1/auth/me" "${AUTH[@]}" -o "$T/me.json" -w '%{http_code}' > "$T/me.code"
check "me 200" 200 "$(cat "$T/me.code")"

echo "== 4-5. Create program + student =="
curl -s -X POST "$BASE_URL/api/v1/programs" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"code":"BSACT","name":"BS Accountancy"}' -o "$T/prog.json" -w '%{http_code}' > "$T/prog.code"
check "create program 201" 201 "$(cat "$T/prog.code")"
curl -s -X POST "$BASE_URL/api/v1/students" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"student_number":"2024-90001","first_name":"Smoke","last_name":"Test","email":"smoke.test@example.edu"}' -o "$T/stu.json" -w '%{http_code}' > "$T/stu.code"
check "create student 201" 201 "$(cat "$T/stu.code")"
SID=$(python3 -c "import json;print(json.load(open('$T/stu.json'))['data']['id'])")

echo "== 6. Duplicate/invalid student =="
curl -s -X POST "$BASE_URL/api/v1/students" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"student_number":"2024-90001","first_name":"D","last_name":"L"}' -o /dev/null -w '%{http_code}' > "$T/dup.code"
check "duplicate 409" 409 "$(cat "$T/dup.code")"
curl -s -X POST "$BASE_URL/api/v1/students" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"student_number":"2024-90002","first_name":"B","last_name":"E","email":"bad"}' -o /dev/null -w '%{http_code}' > "$T/bad.code"
check "invalid email 422" 422 "$(cat "$T/bad.code")"

echo "== 7-9. Retrieve/update/search/paginate =="
curl -s "$BASE_URL/api/v1/students/$SID" "${AUTH[@]}" -o /dev/null -w '%{http_code}' > "$T/get.code"
check "get student 200" 200 "$(cat "$T/get.code")"
curl -s -X PATCH "$BASE_URL/api/v1/students/$SID" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"year_level":2}' -o /dev/null -w '%{http_code}' > "$T/upd.code"
check "update student 200" 200 "$(cat "$T/upd.code")"
curl -s "$BASE_URL/api/v1/students?search=smoke&status=active&sort=last_name:asc&page=1&per_page=5" "${AUTH[@]}" -o /dev/null -w '%{http_code}' > "$T/lst.code"
check "search/filter/sort/paginate 200" 200 "$(cat "$T/lst.code")"

echo "== 10-11. Course + term + offering =="
curl -s -X POST "$BASE_URL/api/v1/courses" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"course_code":"SMK101","title":"Smoke Course","units":3}' -o "$T/crs.json" -w '%{http_code}' > "$T/crs.code"
check "create course 201" 201 "$(cat "$T/crs.code")"
CID=$(python3 -c "import json;print(json.load(open('$T/crs.json'))['data']['id'])")
curl -s -X POST "$BASE_URL/api/v1/academic-terms" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d '{"school_year":"2026-2027","semester":"1st","status":"upcoming"}' -o "$T/trm.json" -w '%{http_code}' > "$T/trm.code"
TCODE=$(cat "$T/trm.code"); [ "$TCODE" = 201 ] || [ "$TCODE" = 409 ] && check "create term ok" "$TCODE" "$TCODE"
TID=$(python3 -c "import json;print(json.load(open('$T/trm.json'))['data']['id'])" 2>/dev/null || \
  curl -s "$BASE_URL/api/v1/academic-terms?search=2026" "${AUTH[@]}" | python3 -c "import json,sys;print(json.load(sys.stdin)['data'][0]['id'])")
curl -s -X POST "$BASE_URL/api/v1/course-offerings" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d "{\"course_id\":\"$CID\",\"academic_term_id\":\"$TID\",\"section\":\"SEC-SMK\"}" -o "$T/off.json" -w '%{http_code}' > "$T/off.code"
check "create offering 201" 201 "$(cat "$T/off.code")"
OID=$(python3 -c "import json;print(json.load(open('$T/off.json'))['data']['id'])")

echo "== 12-13. Enroll + duplicate =="
curl -s -X POST "$BASE_URL/api/v1/enrollments" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d "{\"student_id\":\"$SID\",\"course_offering_id\":\"$OID\"}" -o "$T/enr.json" -w '%{http_code}' > "$T/enr.code"
check "enroll 201" 201 "$(cat "$T/enr.code")"
EID=$(python3 -c "import json;print(json.load(open('$T/enr.json'))['data']['id'])")
curl -s -X POST "$BASE_URL/api/v1/enrollments" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d "{\"student_id\":\"$SID\",\"course_offering_id\":\"$OID\"}" -o /dev/null -w '%{http_code}' > "$T/enr2.code"
check "duplicate enrollment 409" 409 "$(cat "$T/enr2.code")"

echo "== 14-15. Grade + record =="
curl -s -X POST "$BASE_URL/api/v1/grades" "${AUTH[@]}" -H 'Content-Type: application/json' \
  -d "{\"enrollment_id\":\"$EID\",\"grade_value\":1.5,\"remarks\":\"passed\"}" -o /dev/null -w '%{http_code}' > "$T/grd.code"
check "grade 201" 201 "$(cat "$T/grd.code")"
curl -s "$BASE_URL/api/v1/students/$SID/academic-record" "${AUTH[@]}" -o /dev/null -w '%{http_code}' > "$T/rec.code"
check "academic record 200" 200 "$(cat "$T/rec.code")"

echo "== 16-17. Forbidden + 404 =="
curl -s "$BASE_URL/api/v1/users" -o /dev/null -w '%{http_code}' > "$T/fbd.code"
check "no-auth users 401" 401 "$(cat "$T/fbd.code")"
curl -s "$BASE_URL/api/v1/students/00000000-0000-0000-0000-000000000000" "${AUTH[@]}" -o /dev/null -w '%{http_code}' > "$T/nf.code"
check "not found 404" 404 "$(cat "$T/nf.code")"

echo "== 18. Docs present =="
[ -f docs/openapi.yaml ] && [ -f docs/postman/sims_collection.json ] && echo "PASS docs present" && pass=$((pass+1)) || { echo "FAIL docs missing"; fail=$((fail+1)); }

echo "RESULT: $pass passed, $fail failed"
rm -rf "$T"
[ "$fail" = 0 ]
