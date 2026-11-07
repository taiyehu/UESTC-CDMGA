# parity-audit

`node scripts/parity-audit.mjs`

Environment:
- `VUE_URL` default `http://localhost:8082`
- `REACT_URL` default `http://localhost:5174`
- `AUDIT_OUT` default `ref/local/logs/parity-audit.json`
- `CHROME_PATH` optional Chromium executable

Requires local backend on 8080 and a test account `tester/test123456`; admin routes use `admin/test123456`.
