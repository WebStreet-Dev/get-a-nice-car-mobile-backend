# Dokploy: Admin Panel + Backend Deployment Checklist

Use this when the admin panel shows **Network Error** or **CORS** errors after deployment.

---

## 1. Admin Panel (frontend) — what to set

**Service:** Nice Car Inc Admin Panel (the static/Vite app in Dokploy)

| Variable        | Value                                                                 | Notes |
|----------------|-----------------------------------------------------------------------|--------|
| `VITE_API_URL` | `http://nice-car-inc-backend-nicecarbackend-3wxq-28377e-31-220-109-16.traefik.me/api/v1` | Your **backend** base URL. **No trailing slash, no `/*`.** Replace with your actual backend URL from Dokploy. |

- This is the **only** env var the admin panel needs for the API.
- **Wrong:** `.../api/v1/*` — the `/*` breaks login (requests become `.../api/v1/*/auth/login`).
- After changing it, **rebuild/redeploy the admin panel** so the new value is baked into the build (Vite inlines `VITE_*` at build time).

**Runtime config (if build-time env is not available):** The admin also reads the API URL from `config.json` on startup. The build writes `public/config.json` from `VITE_API_URL` when you run `npm run build`; that file is copied to the publish directory. So if Dokploy passes `VITE_API_URL` when it runs the build, the built app will have the correct URL. If it does not, add or overwrite `config.json` in the admin’s deploy output (same folder as `index.html`) with:
```json
{"VITE_API_URL": "http://nice-car-inc-backend-nicecarbackend-3wxq-28377e-31-220-109-16.traefik.me/api/v1"}
```
(Use your real backend URL, no trailing slash.) Redeploy so this file is served; no rebuild needed when you change the URL.

---

## 2. Backend (API) — what to set for CORS

**Service:** Nice Car Inc Backend (the Node/Express API in Dokploy)

| Variable       | Value                                                                 | Notes |
|----------------|-----------------------------------------------------------------------|--------|
| `CORS_ORIGIN` | `http://nice-car-inc-prod-backend-nice-car-inc-a-588512-31-220-109-16.traefik.me` | Exact **origin** of the admin panel (protocol + host, **no path**, **no trailing slash**). Replace with your actual admin panel URL. Trailing slash can cause CORS to fail. |

**Multiple origins (e.g. admin + another frontend):** comma-separated, spaces are OK (they are trimmed):

```bash
CORS_ORIGIN=https://other-site.com,http://nice-car-inc-prod-backend-nice-car-inc-a-588512-31-220-109-16.traefik.me
```

- `CORS_ORIGIN` is read **only by the backend**. Setting it on the admin panel has no effect.
- After changing `CORS_ORIGIN`, **redeploy the backend** (full deploy, not just restart) so the new value is used at runtime.

---

## 3. Quick reference

| You want…                          | Where to set it        | Then…              |
|------------------------------------|------------------------|---------------------|
| Admin to call the correct API      | Admin panel: `VITE_API_URL` | Rebuild/redeploy admin |
| Backend to allow admin’s origin     | Backend: `CORS_ORIGIN`      | Redeploy backend    |

---

## 4. Base URLs

- **Backend base URL** (for `VITE_API_URL`):  
  The URL where the API is served, e.g.  
  `http://nice-car-inc-backend-nicecarbackend-3wxq-28377e-31-220-109-16.traefik.me`  
  The app uses this + `/api/v1`, so `VITE_API_URL` should be:  
  `http://...traefik.me/api/v1` (no trailing slash).

- **Admin panel origin** (for `CORS_ORIGIN`):  
  The URL you see in the browser when you open the admin (e.g. `http://nice-car-inc-prod-backend-nice-car-inc-a-588512-31-220-109-16.traefik.me`).  
  No path, no trailing slash.

---

## 5. If you still see CORS or Network Error

1. Confirm **backend** env has `CORS_ORIGIN` with the **exact** admin origin (copy from browser address bar).
2. **Redeploy the backend** after changing env (not just “Restart”).
3. Confirm **admin** env has `VITE_API_URL` pointing to the backend, then **rebuild and redeploy the admin** (so the new base URL is in the built JS).
4. In Dokploy, ensure env vars are **available at runtime** (and for the admin, at **build time** for `VITE_*` if your setup uses that).
5. **Runtime config:** If `VITE_API_URL` is not available when the admin is built, add a `config.json` next to the built files (see section 1) with your backend URL. The app reads it on load and no rebuild is needed when the URL changes.
