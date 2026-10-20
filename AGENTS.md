# Architecture rules

- Render and edit stories on the same fixed 360×640 composition scaled uniformly into each frame; stable overlay widths and local composition tokens preserve wrapping and appearance regardless of position, viewport or admin theme.
- Keep the active editorial Leaflet map separate from the preserved legacy Map component, so reverting providers or presentation never requires reconstructing the old implementation.
- Reuse the tested footer pointer state machine for temporary investigation revelation with scoped targets and document interruption listeners; revelation is local React state, never storage or authorization.

- The persistent customer mobile header owns safe-area spacing on every route, including home; page content must not duplicate that inset, so installed-app status bars never overlap header controls.

- Scope admin appearance tokens by the active admin route on the document root and persist selection locally; this includes portalled dialogs without theming customer pages or changing authentication.

- Keep TILT & FADE behind an independent desktop capability gate and lazy route; Matter.js owns fixed-step pinball physics, versioned level data stays separate, and local cheats never authorize admin actions or write competitive records.

- Keep PARADOX RUN isolated behind a PC capability gate with lazy 3D loading and no customer-route transforms or overlays; the game must not load on mobile or alter booking/admin behavior.
- Keep versioned city, race, skin and editor data separate from the Rapier capsule controller, camera, rendering and local persistence; new maps and appearances must reuse the existing game rules.
- Use one fixed-step physics owner and explicit gravity-relative movement; best-run ghosts replay recorded transforms and are invalidated when city/race geometry changes.
- Render architectural meshes with metre-based UVs, with seam-safe connector geometry, so texture density and collision layouts remain consistent across city sizes.
- Keep the investigation independent of PARADOX RUN; lazy-load its mobile-capable epilogue only after server-confirmed completion to avoid loading game physics on customer routes.
- Keep investigation answers, future evidence, release gates and visit-card consumption server-only; its service endpoint derives identity from a validated session and checks database roles for management, independently of legacy AdminGuard.

- Keep the mobile footer entry gesture in a pure tested state machine with document-level interruption listeners; this enforces uninterrupted taps without changing AdminGuard authentication.

- Keep booking steps inside one keyed AnimatePresence boundary with wait mode; separate step boundaries reserve incoming space above outgoing content on backwards navigation.
- Mount mobile booking actions in a body portal and measure the header/tab bar for sticky offsets; route transforms must not trap viewport controls.
- Share one booking coupon renderer across summary and confirmation, showing it in only the active context; keep discount validation in the existing booking logic.

- Keep homepage letter-photo animation in the homepage presentation, with one text-clipped photo overlay at a time; this preserves readable branding without changing configured carousel media or other pages.- Keep the app-wide visual identity in one stylesheet loaded after the legacy global styles and in Tailwind's palette remap; this restyles every page without touching page logic.
- On mobile, /admin renders AdminMobileShell (bottom tab bar + "Más" sheet + AdminToday) instead of the sidebar layout; desktop keeps AdminSidebar. Both share the same section components and dialogs, so new admin sections must be added to ADMIN_SECTION_TITLES and the more-groups list in AdminMobileShell.tsx as well as Admin.tsx.
