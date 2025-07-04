# Work Plan: PWA Integration for Next.js App

## Goal
Integrate Progressive Web App (PWA) support into the Next.js app in `apps/web` using best practices and Next.js conventions.

## Steps

1. **Install Dependencies**
   - [x] Add `@serwist/next` and `serwist` to `apps/web`.
   - [x] Remove `next-pwa` if previously installed.

2. **Update Next.js Configuration**
   - [x] Edit `next.config.js` to wrap the config with Serwist (`withSerwist`) and configure service worker source/destination.

3. **Add Manifest and Icons**
   - [x] Create `app/manifest.ts` (Next.js 15+ convention) with app details.
   - [x] Add required icons (all standard Android, iOS, and Windows icons) to `public/icons/`.
   - [x] Remove old `public/manifest.json` if present.

4. **Service Worker**
   - [x] Create `app/sw.ts` using Serwist's recommended template for offline support and caching.
   - [x] Remove old `public/sw.js` if present.

5. **Set Metadata in App Router**
   - [x] Use the Next.js metadata API in `app/layout.tsx` to set all PWA-related meta tags (theme color, app name, description, icons, Apple tags, Open Graph, Twitter, viewport, etc.).
   - [x] Use `/og-image.png` in the public directory for Open Graph and Twitter preview images.
   - [x] No need to manually add `<link rel="manifest">` or `<meta name="theme-color">` in `<Head>`; use the metadata API instead.

6. **Test PWA Functionality**
   - [x] Build the app and verify service worker generation, offline support, and manifest loading.
   - [ ] Test with Lighthouse or similar tools for PWA compliance (optional, recommended).

7. **Document the Integration**
   - [x] Update project documentation to describe PWA features and how to maintain them (this file).

## Notes
- Serwist is now the recommended approach for offline/PWA support in Next.js 15+ (App Router).
- Offline support is automatic after the user's first online visit, as Serwist precaches all static assets and app shell.
- Remove any incorrect or unused files (e.g., `public/_document.html`, old manifest or service worker files).
- All PWA metadata is now managed via the Next.js metadata API in `app/layout.tsx`.
- Open Graph and Twitter images use `/og-image.png` in the public directory (1200x630px, recommended size).
- Follow Next.js and project conventions for all changes.
- Ensure accessibility and performance are not negatively impacted by PWA features.
- For advanced caching or push notifications, refer to Serwist documentation.
