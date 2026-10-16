# Architecture rules

- Keep CUT / BEAT rendering and timing in a lazily loaded Phaser scene, with pure tested scoring rules and React controls; this isolates the game from booking and avoids loading its engine on the homepage.

- Keep booking steps inside one keyed AnimatePresence boundary with wait mode; separate step boundaries reserve incoming space above outgoing content on backwards navigation.
- Mount mobile booking actions in a body portal and measure the header/tab bar for sticky offsets; route transforms must not trap viewport controls.
- Share one booking coupon renderer across summary and confirmation, showing it in only the active context; keep discount validation in the existing booking logic.

- Keep homepage letter-photo animation in the homepage presentation, with one text-clipped photo overlay at a time; this preserves readable branding without changing configured carousel media or other pages.- Keep the app-wide visual identity in one stylesheet loaded after the legacy global styles and in Tailwind's palette remap; this restyles every page without touching page logic.
- On mobile, /admin renders AdminMobileShell (bottom tab bar + "Más" sheet + AdminToday) instead of the sidebar layout; desktop keeps AdminSidebar. Both share the same section components and dialogs, so new admin sections must be added to ADMIN_SECTION_TITLES and the more-groups list in AdminMobileShell.tsx as well as Admin.tsx.
