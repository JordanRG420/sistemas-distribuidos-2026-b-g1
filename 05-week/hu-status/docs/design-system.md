# Design System

> The design system is the shared visual language between design and development.
> It prevents inconsistencies, accelerates design, and reduces rework.
> **Rule:** Before creating a new component, check here if it already exists.

---

## Brand identity

**Crimson Circuit** takes the navy and brick red from the reference gradient
and uses them to build a panel that feels **alert**, not relaxed — built for
roles who live watching numbers that can turn red (stock out, today's
sales). The gradient's navy is reused directly as ink (text color) in the
light theme, not just as an accent: it's what gives the warm off-white
canvas its character, instead of a generic white with a red button on top.
In the dark theme, that same navy stops being ink and becomes the canvas
itself — the most literal "monitoring console" reading of the palette:
red and coral numbers floating over near-black, like an active alarm panel.

**Contrast rule with the logo:** the logo lives natively on pale mint
(`#EFFAF6` approx.). In the light theme, the warm peach-white canvas
(`#FFF9F6`) is a completely different color family from that mint — warm vs.
cool — so there's no risk of the two blending even though both are light.
In the dark theme, the near-black canvas is the option that creates the
least contrast ambiguity against that same mint origin. Either way, the logo
always sits inside its own white/surface card with its own shadow, so it
reads as an object floating on the panel, never as if it shares the panel's
surface.

**Primary and Danger share a red family — on purpose, with a caveat.** The
brand red (`#B51A28` light / `#A82C24` dark) and the "danger" red
(`#D73768` light / `#FB7185` dark) are visually close. This is acceptable
because the system **never depends on color alone**: every badge and every
Danger button carries explicit text ("Agotado", "Desactivar producto"), so
tone ambiguity never becomes meaning ambiguity.

---

## Design tokens

### Colors — Light theme

```css
/* Base palette — navy and red from the reference gradient */
--color-primary-50:  #FDECE4;   /* Lightest — subtle backgrounds, selected-row tint */
--color-primary-100: #F0D8CC;   /* Soft badges, hover backgrounds */
--color-primary-300: #C65A3B;   /* Icons, large headings (≥20px/700), decorative accents ONLY — 4.26:1 on white: passes large text (≥3:1), fails normal text (<4.5:1) */
--color-primary-500: #B51A28;   /* Default — buttons, links, active nav (6.68:1 on white with white text on top) */
--color-primary-700: #931623;   /* Hover / pressed state */
--color-primary-900: #641A2E;   /* Darkest — Secondary button text/border (12.15:1 on white) */

--color-neutral-50:  #FFF9F6;   /* Page canvas — white with a peach veil */
--color-neutral-900: #161E2F;   /* Ink — the gradient's navy, reused as text */

/* Semantic colors */
--color-success-50:  #E7F7EF;
--color-success-500: #1F9D6D;
--color-success-700: #1A855D;   /* Badge text, button backgrounds (4.58:1) */

--color-warning-50:  #FDF1E2;
--color-warning-500: #E08A1E;
--color-warning-700: #A86716;   /* Badge text, button backgrounds (4.53:1) */

--color-error-50:    #FDE9EF;
--color-error-500:   #E23A6E;
--color-error-700:   #D73768;   /* Badge text, button backgrounds (4.54:1) — a different red from primary, see Brand identity */

--color-info-50:  #FDECE4;
--color-info-700: #A86716;   /* This palette has no teal of its own; "info" borrows warning's tone instead of competing with the brand red — keeps a neutral message from reading as an alarm */

/* Role alias — resolves differently per theme, see Buttons */
--color-secondary-action: var(--color-primary-900);

/* Text */
--color-text-primary:   #161E2F;  /* Ink (16.66:1 on white) */
--color-text-secondary: #7C645E;  /* Warm muted (5.47:1 on white) */
--color-text-disabled:  #D9C7BE;  /* Disabled controls are exempt from AA contrast */

/* Backgrounds */
--color-bg-page:    #FFF9F6;
--color-bg-card:    #FFFFFF;
--color-bg-overlay: rgba(22, 30, 47, 0.45);
```

**Why "info" doesn't use red:** blue/teal is the standard association for
informational content, and this palette has no teal. Using the brand red for
"info" would risk a neutral message ("remember that...") reading as an
alert. Borrowing warning-700's warm tone instead keeps "info" in the same
warmth family as the rest of the palette while staying visually distinct
from "danger."

**Why `-300` is marked "large text only":** the coral `#C65A3B` clears the
large-text threshold (3:1) but not normal text (4.5:1) — a real physical
limit of that hue, not an oversight.

### Colors — Dark theme

```css
/* Surface — its own independent dark scale, NOT a tint of --color-primary */
--color-bg-page:      #12141C;
--color-bg-card:       #161E2F;   /* surface */
--color-bg-card-alt:   #242F49;   /* surface-2 — hover, alternate table row */
--color-border:        #3B4459;
--color-bg-overlay:    rgba(0, 0, 0, 0.55);

/* Primary — same red/coral family, retuned for text on a dark surface */
--color-primary-300: #FFA586;   /* Coral — Secondary text/border, icons, large figures (8.71:1 on surface) */
--color-primary-500: #A82C24;   /* Default — button background (6.88:1 with white text) */
--color-primary-700: #C4342B;   /* Hover / pressed — LIGHTER than default, see note below */

/* Role alias — resolves differently per theme, see Buttons */
--color-secondary-action: var(--color-primary-300);

/* Semantic colors — same meaning as the light theme, inverted technique:
   saturated, bright text instead of a dark "-700", over a translucent
   background instead of a solid pastel. Same variable names as light. */
--color-success-50:  rgba(52, 211, 153, 0.16);
--color-success-700: #34D399;   /* 8.67:1 on surface */
--color-warning-50:  rgba(251, 191, 36, 0.16);
--color-warning-700: #FBBF24;
--color-error-50:    rgba(251, 113, 133, 0.16);
--color-error-700:   #FB7185;   /* 6.19:1 on surface */
--color-info-50:  rgba(251, 191, 36, 0.16);  /* same warning-borrow as light, see that note */
--color-info-700: #FBBF24;

/* Text */
--color-text-primary:   #F5EDE6;  /* 15.88:1 on --color-bg-page */
--color-text-secondary: #B3A79C;  /* 7.81:1 on --color-bg-page */
--color-text-disabled:  #5C554E;  /* Disabled controls are exempt from AA contrast */
```

**Why hover gets lighter instead of darker:** in the light theme, `-700` is
darker than `-500` because darkening increases contrast against a white
background — the standard convention. On a near-black surface that logic
inverts: darkening an already-dark button reduces legibility instead of
increasing it. Here `-700` (`#C4342B`) is **lighter** than `-500`
(`#A82C24`) — the button brightens on hover/focus, which is what actually
reads as "this responded" on a dark canvas.

**Why the semantic colors change technique, not meaning:** in the light
theme, a success badge uses dark text (`success-700`) on a pastel background
(`success-50`) — that works because the background is nearly white. On a
dark canvas the same recipe produces a muddy, illegible pastel. The
standard fix inverts it: **saturated, bright text** on a **translucent**
background at 16% opacity of that same color. The meaning ("this is a
success") is identical; the technique for reaching 4.5:1+ flips because the
background flipped.

### Typography

Identical in both themes — typography is a personality decision, not a
light/dark decision.

```css
--font-family-heading: 'Big Shoulders Display', sans-serif;  /* Headings, page titles, stat values */
--font-family-sans:    'IBM Plex Sans', sans-serif;            /* Body copy, labels, buttons */
--font-family-mono:    'JetBrains Mono', monospace;            /* SKUs, prices, stock counts, dates */

--font-size-xs:   0.75rem;   /* 12px */
--font-size-sm:   0.875rem;  /* 14px */
--font-size-base: 1rem;      /* 16px */
--font-size-lg:   1.25rem;   /* 20px */
--font-size-xl:   1.563rem;  /* 25px */
--font-size-2xl:  1.953rem;  /* 31px */
--font-size-3xl:  2.441rem;  /* 39px — login masthead only */

--font-weight-regular:  400;
--font-weight-medium:   500;
--font-weight-semibold: 600;
--font-weight-bold:     700;
--font-weight-black:    900;   /* Exclusive to Big Shoulders Display headings */

--line-height-tight:  1.2;
--line-height-normal: 1.5;
--line-height-loose:  1.8;
```

**Using Big Shoulders Display:** an industrial condensed face, meant to read
as warning signage, not an editorial headline. Always used at **weight 900
(black) and small caps** (`text-transform: uppercase`, `letter-spacing:
0.01em`) — at a lighter weight it loses the reason it was chosen. Reserved
for `h1`/`h2` and a stat tile's highlighted value; never in paragraphs or
buttons (that stays IBM Plex Sans).

**Unchanged rule:** every numeric value the user needs to scan or compare
stays in `--font-family-mono` with `font-variant-numeric: tabular-nums`.

### Spacing

Identical in both themes.

```css
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

### Borders and shadows — Light theme

```css
/* Border radius — tighter than a typical B2B tool on purpose: navy + red +
   condensed type read "industrial/warning signage," and a straighter
   radius reinforces that reading instead of softening it. */
--radius-sm: 4px;
--radius-md: 8px;    /* Default — cards, buttons, inputs */
--radius-lg: 14px;   /* Modals, large panels */
--radius-full: 9999px;  /* Badges, avatars */

/* Shadows — tinted with the primary red */
--shadow-sm: 0 2px 6px rgba(181, 26, 40, 0.08);
--shadow-md: 0 6px 18px rgba(181, 26, 40, 0.14), 0 2px 5px rgba(22, 30, 47, 0.06);
--shadow-lg: 0 14px 32px rgba(181, 26, 40, 0.18);
```

### Borders and shadows — Dark theme

```css
/* Radius: identical to the light theme (4/8/14/full) — radius is shape,
   not color, and doesn't change between light and dark. */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 14px;
--radius-full: 9999px;

/* Shadows — this is where dark breaks from "tinted with primary": a red
   tint over an already near-black background is practically invisible.
   What actually separates a card from the canvas in dark mode is an
   ambient black shadow. */
--shadow-sm: 0 4px 10px rgba(0, 0, 0, 0.30);
--shadow-md: 0 10px 22px rgba(0, 0, 0, 0.35);
--shadow-lg: 0 20px 44px rgba(0, 0, 0, 0.40);
```

---

## Components

### Buttons

| Variant | Background | Text | Use | Disabled state |
|---------|-----------|------|-----|-----------------|
| Primary | `--color-primary-500` | White | Main action on the page | `opacity: 0.5; cursor: not-allowed` |
| Secondary | Transparent, `--color-secondary-action` border | `--color-secondary-action` | Secondary actions | same |
| Danger | Transparent, `--color-error-700` text | `--color-error-700` | Destructive actions (deactivate product/customer) | same |
| Ghost | Transparent | `--color-text-secondary` | Tertiary actions (edit, view detail) | same |

**Why Secondary uses an alias:** the color role that makes a border/text
legible for Secondary flips between themes — the darkest maroon (`-900`,
`#641A2E`) in light, the lightest coral (`-300`, `#FFA586`) in dark, because
what counts as "readable on this surface" inverts with the surface itself.
`--color-secondary-action` resolves to whichever one is correct for the
active theme, so the component's CSS never has to branch on theme.

**Usage rules (unchanged):**
- Only one Primary action per view.
- Danger only with modal confirmation ("¿Estás seguro?").
- Buttons show a loading state for async operations (spinner replaces label, same width).
- Never use a gradient as a button background — none of this palette's tokens are gradients, so this no longer needs a special callout, but the rule stays for future palette changes.

### Forms

| Component | When to use |
|-----------|-------------|
| Input text | Single-line free text (customer name, product name) |
| Input number (mono) | Quantities, prices, stock adjustments — `font-family-mono`, right-aligned |
| Select | Fixed list of options (< 15 items) — e.g. category |
| Combobox | List with search (products/customers in the sale form, potentially hundreds) |
| Checkbox | Independent binary option |
| Toggle | Enable/disable a feature (e.g. product active/inactive) |
| DatePicker | Date range filters in reports |

**Focus ring:** `--color-primary-500`.

**Dark theme detail:** the input background is `--color-bg-page`, not
`--color-bg-card` — the field sits slightly "sunken" relative to the card
that contains it. The light theme doesn't need this trick because its
surface is already pure white.

**Error messages in forms:**
- The message appears below the field, in `--color-error-700`.
- The field border turns `--color-error-700`.
- The message states how to fix the error, matching the backend's `fieldErrors` text as-is.

```
✓ "El stock no puede ser negativo"
✗ "Campo inválido"
```

### Feedback

| Component | When | Duration |
|-----------|------|---------|
| Toast/Snackbar | Action confirmations ("Venta registrada") | 4 seconds |
| Inline alert | Form errors, role-scope reminders | Until corrected / dismissed |
| Modal | Destructive confirmations, irreversible actions | Until the user decides |
| Loading spinner | Operations > 200ms | Until finished |
| Skeleton | Loading list content / cards | Until loaded |

Alert tones map to the semantic "-700" text on "-50" background pairing in
both themes — info uses the borrowed warning tone (see Colors); success/
warning/error use their own pair.

### Data table

| Aspect | Behavior |
|--------|---------|
| Pagination | Maximum 20 rows per page |
| Sorting | Click on column header, toggle asc/desc |
| Filters | Filter row above the table (category, stock status) |
| Selection | Checkbox in the first column, for bulk actions |
| Actions | Final column, right-aligned: Ghost "Editar" + Danger-ghost "Desactivar" |
| Numeric columns | Right-aligned, `--font-family-mono`, tabular numerals |
| Status | `Badge`, using the "-700" text on "-50" background pairing (both themes) |
| Empty state | Illustration + message in Spanish + primary action CTA |

**Status badges (stock)** — same token names in both themes, values differ per the Colors section above:

| State | Badge |
|-------|-------|
| En stock | `--color-success-700` text on `--color-success-50` |
| Stock bajo | `--color-warning-700` text on `--color-warning-50` |
| Agotado | `--color-error-700` text on `--color-error-50` |

---

## UX patterns

### Principles

1. **Confirm before destroying:** any action that deactivates a product, customer, or category requires a confirmation modal — the domain uses soft delete (`active` flag), so this is reversible in the database but should still feel deliberate to the user.

2. **Immediate feedback:** every action has a visual response in < 100ms (loading state at minimum).

3. **Prevent rather than correct:** validate stock and required fields in real time in the sale form, not only on submit — but the backend total and stock check are always authoritative (AC8: a sale can still be rejected with a 409 if stock changed between the preview and the submit).

4. **Empty state as a feature:** an inventory clerk's first screen after login (Productos) with zero data should point at "+ Nuevo producto", not just show a blank table.

### Error handling

| Scenario | What to show |
|----------|-------------|
| Network error (status 0) | Toast "No se pudo conectar con el servidor" with a retry button |
| 400 (validation) | Inline field errors using the backend's `fieldErrors` messages |
| 401 / no session | Return to the login screen |
| 403 (role scope) | Redirect to the user's own default module |
| 404 | 404 screen with a link back to the user's default module |
| 409 (domain conflict) | Inline alert with the backend's message as-is (e.g. "No hay stock suficiente", "El cliente está inactivo") |
| 500 | Error toast + "Reintentar" button |

---

## Accessibility guide (minimums)

| Aspect | Minimum required |
|--------|-----------------|
| Text contrast | WCAG AA (4.5:1 normal text, 3:1 large text ≥ 18px or 14px bold) — verified for every token pair in both themes above |
| Keyboard navigation | All interactive elements accessible with Tab, visible focus ring in `--color-primary-500` |
| Form labels | All fields with associated label (`for` / `aria-label`) |
| Images | Descriptive alt text (the logo already uses `alt="Synkro Tech"`) |
| Color independence | Stock status is never color-only: the badge text always says "En stock" / "Stock bajo" / "Agotado", not just a colored dot |
| Theme switching | Whichever theme is active, all token pairs above have been verified at 4.5:1+ (normal) or 3:1+ (large/decorative) — switching themes never silently drops below AA |

---

## Correlations

- Navigation map → `12-ux-ui/navigation-map.md`
- Wireframes → `03-product/` (HU-DOCS-18)
- Domain entities behind these screens → `02-domain/entities-and-rules.md`
- Current implementation of these tokens → `synkro-tech` repo, `src/styles/tokens.css` and `global.css` (HU-FE-02 implements the **light theme only** for Corte 1; the dark theme is documented here as the target design but is explicitly scoped for **Corte 2** — do not build it yet)
