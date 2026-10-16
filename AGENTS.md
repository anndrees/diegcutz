# Architecture rules

- Keep homepage letter-photo animation in the homepage presentation, with one text-clipped photo overlay at a time; this preserves readable branding without changing configured carousel media or other pages.- Keep the app-wide visual identity in one stylesheet loaded after the legacy global styles and in Tailwind's palette remap; this restyles every page without touching page logic.
- On mobile, /admin renders AdminMobileShell (bottom tab bar + "Más" sheet + AdminToday) instead of the sidebar layout; desktop keeps AdminSidebar. Both share the same section components and dialogs, so new admin sections must be added to ADMIN_SECTION_TITLES and the more-groups list in AdminMobileShell.tsx as well as Admin.tsx.
