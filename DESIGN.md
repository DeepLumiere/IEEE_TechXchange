# CiperQuest — Design System

> This document defines the **visual DNA** of CiperQuest.
> It is the single source of truth for every page, component, and future feature.
> Follow it to keep the product consistent as it scales.

---

## 1 · Design Identity

### Mood & Atmosphere

**"Tactical Neon — dense, alive, immersive."**

CiperQuest feels like looking into a covert operative's HUD.
The interface is dark and high-contrast, punctuated by neon glows that draw the eye to interactive elements. Panels use translucent glass over deep backgrounds, giving depth without clutter. Motion is purposeful — ambient drifts and micro-reactions, never gratuitous.

### Guiding Principles

| Principle | What it means in practice |
|---|---|
| **Cinematic depth** | Layer translucent panels, blurred backdrops, and soft glows to create a sense of z-depth. Nothing should feel flat. |
| **Focused energy** | Use bright accent color sparingly — it marks interactive or important elements, not decoration. |
| **Restrained motion** | Animate to guide attention (hover feedback, entrance transitions). Avoid looping flourishes that compete with content. |
| **Information density** | Embrace compact layouts and uppercase micro-labels. Whitespace exists to separate groups, not to pad individual items. |
| **Responsive adaptation** | Layouts collapse gracefully. Grids go from multi-column to single-column; panels reflow but keep the same visual language. |

---

## 2 · Design Tokens

### 2.1 Color Palette

Use CSS custom properties defined on `:root`. Every color decision should reference a token — never hard-code hex values in component styles.

#### Core Palette

| Token | Value | Usage |
|---|---|---|
| `--accent-primary` | `#59f2ff` | Primary interactive color — buttons, links, focus rings, active borders. |
| `--accent-warning` | `#ffdd57` | Secondary accent — labels, caution indicators, decorative borders. |
| `--text-main` | `#f4f7ff` | Primary text — headings, body copy, high-emphasis labels. |
| `--text-muted` | `#94a3b8` | Secondary text — hints, metadata, disabled labels. |

#### Surface Colors

Surfaces are not stored as tokens yet but follow strict conventions:

| Surface | Value | Notes |
|---|---|---|
| **Page background** | `radial-gradient(circle at top, #1b243b 0%, #020617 55%)` | Deep navy-to-near-black gradient. Covers the full viewport. |
| **Panel fill** | `rgba(15, 23, 42, 0.78)` – `rgba(15, 23, 42, 0.98)` | Semi-transparent slate. Always pair with `backdrop-filter: blur(...)`. |
| **Panel border** | `rgba(148, 163, 184, 0.4)` – `rgba(148, 163, 184, 0.55)` | Cool-grey hairline. Slightly brighter on interactive elements. |
| **Inset surface** | `rgba(2, 6, 23, 0.72)` | Darker recessed areas inside panels (e.g., identity strips, input fields). |

> **Recommendation:** Promote the surface values above into named CSS custom properties (e.g., `--surface-panel`, `--surface-inset`, `--border-subtle`) as the system grows.

#### Semantic Colors

For status indicators and individualized element theming:

| Purpose | Color | Notes |
|---|---|---|
| Online / success | `#22c55e` → `#166534` (radial gradient) | Used in status dots. Pair with a matching `box-shadow` glow. |
| Accent blue family | `#38bdf8`, `#0ea5e9`, `#0284c7` | CTA buttons, avatar gradients, highlight rings. |
| Tile individuation | See §5.4 | Each card may carry a unique gradient tint — but all share the same border, glow, and hover treatment. |

#### Glow / Neon Conventions

Neon glow is the signature visual device. Apply it via `box-shadow` and `text-shadow`:

```css
/* Typical neon glow on an element with --accent-primary */
box-shadow: 0 0 18px rgba(89, 242, 255, 0.9);

/* Subdued glow on text */
text-shadow: 0 0 12px rgba(56, 189, 248, 0.65);
```

- Keep glow radius between **10 px – 28 px** for balance.
- Use **higher opacity (0.8–1.0)** on interactive/hover states, **lower (0.3–0.5)** at rest.
- Never glow body text — reserve it for logos, headings, or status indicators.

---

### 2.2 Typography

#### Font Stack

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont,
  "SF Pro Text", "Segoe UI", sans-serif;
```

No external font dependency. Performance-first.

#### Scale & Roles

| Role | Size | Weight | Transform | Spacing | Example |
|---|---|---|---|---|---|
| **Display / Section Title** | `clamp(28px, 3vw, 32px)` | 700 | `uppercase` | `0.12em` | "Console Modes" |
| **Card Label** | `24px` | 700 | none | `0.02em` | Tile primary text |
| **Logo / Brand** | `20px` (desktop) / `17px` (mobile) | 600 | `uppercase` | `0.14em` | "CiperQuest" |
| **Body** | `13px – 14px` | 400 | none | normal | Paragraphs, descriptions |
| **Micro-label / Tag** | `11px – 13px` | 400–500 | `uppercase` | `0.16em – 0.18em` | Status headers, tags |
| **Hint / Caption** | `11px – 12px` | 400 | none | normal | Helper text, secondary info |

#### Typography Rules

- **Uppercase + wide letter-spacing** is the tactical-console voice. Use for section titles, tags, status labels, and navigation items.
- **Sentence-case** for body copy, messages, and descriptions — readability takes priority over aesthetic.
- Never go below `11px`. Below that threshold, legibility breaks on standard screens.
- Line-height for body text: **1.35 – 1.5**. For labels and tags, tighter line-height is fine (1.1 – 1.2).

---

### 2.3 Spacing

Spacing is compact but deliberate. There is no rigid 8-point grid, but values tend to cluster around multiples of **4 px**:

| Scale | Value | Typical use |
|---|---|---|
| `xs` | `4px` | Inner gaps, tight element margins. |
| `sm` | `6px – 8px` | Padding inside compact elements (tags, status dots). |
| `md` | `10px – 14px` | Gaps between siblings, padding within panels. |
| `lg` | `16px – 20px` | Section padding, tile inner padding, page margin. |
| `xl` | `28px – 32px` | Between major sections on desktop. |

> **Recommendation:** Codify these as CSS custom properties (`--space-xs` through `--space-xl`) for consistency.

---

### 2.4 Elevation & Shadows

Depth is communicated through layered shadows and `backdrop-filter`.

| Level | Shadow | Blur | Use case |
|---|---|---|---|
| **Ambient** | `0 10px 30px rgba(15, 23, 42, 0.7)` | `blur(10px)` | Standard panels (header, cards). |
| **Elevated** | `0 32px 80px rgba(0, 0, 0, 0.85)` | `blur(22px)` | Floating overlays, dialog panels. |
| **Neon halo** | `0 0 18px <accent-color>` | — | Interactive element emphasis (buttons, active cards). |
| **Drop silhouette** | `drop-shadow(0 18px 40px rgba(2, 6, 23, 0.9))` | — | Floating imagery (mascots, illustrations). |

Existing token:

```css
--shadow-strong: 0 32px 80px rgba(0, 0, 0, 0.85);
```

---

### 2.5 Border Radii

| Shape intent | Radius | Examples |
|---|---|---|
| **Pill / fully rounded** | `999px` | Buttons, tags, avatar, status dots. |
| **Panel / card** | `14px – 18px` | Chat panel, mode tiles, header bar. |
| **Subtle rounding** | `12px` | Inset strips, secondary containers. |

Rule of thumb: larger containers get **14–18 px**; small interactive elements get **pill (999 px)**.

---

## 3 · Glassmorphism — The Panel Recipe

Almost every surface in CiperQuest follows the same "glass panel" recipe. Memorize it:

```css
.panel {
  background: rgba(15, 23, 42, 0.78);       /* 1. Semi-transparent slate fill */
  border: 1px solid rgba(148, 163, 184, 0.4); /* 2. Cool-grey hairline border  */
  border-radius: 16px;                        /* 3. Generous rounding           */
  backdrop-filter: blur(10px);                 /* 4. Frosted-glass blur          */
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.7); /* 5. Depth shadow            */
}
```

**Variations:**
- **Deeper panels** increase fill opacity toward `0.94 – 0.98` and blur toward `22px`.
- **Inset containers** use `rgba(2, 6, 23, 0.72)` with no blur — they sit *inside* a blurred parent.
- **Borders brighten** on hover or active states (opacity `0.45 → 0.9`).

---

## 4 · Motion & Interaction

### 4.1 Transition Defaults

All interactive state changes should use:

```css
transition: all 150ms ease-out;
```

For multi-property transitions, be explicit:

```css
transition:
  border-color 180ms ease-out,
  box-shadow 180ms ease-out,
  transform 180ms ease-out;
```

- Entrance/exit animations: **200 ms**, `ease-out`.
- Ambient loops (floating, pulsing): **4–5 s**, `ease-in-out`, `infinite`.
- Micro-feedback (talk bursts, shakes): **400–520 ms**, one-shot.

### 4.2 Hover Patterns

Every interactive element must have a visible hover response. Standard treatments:

| Element type | Hover treatment |
|---|---|
| **Pill button** | `translateY(-1px)`, `brightness(1.05)`, brighter glow shadow. |
| **Card / tile** | `translateY(-4px) scale(1.03)`, glow shadow expansion, optional sheen overlay. |
| **Ghost button** | Border brightens, text color shifts from muted to main. |

### 4.3 Parallax

The background and floating panels react subtly to cursor position using CSS custom properties `--mx` and `--my` (set via JS `mousemove`):

```css
transform: translate3d(
  calc((var(--mx) - 50%) * <factor-x>),
  calc((var(--my) - 50%) * <factor-y>),
  0
);
```

- Background layer: factor `−0.02` / `−0.03` (slow counter-movement).
- Foreground panels: factor `0.006` / `0.008` (subtle drift toward cursor).

### 4.4 Future: Reduced Motion

Respect `prefers-reduced-motion: reduce` by disabling parallax, floating loops, and multi-step keyframe animations. Keep simple opacity/color transitions.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5 · Atomic Components

These are the building blocks. Every new page should compose from these patterns.

### 5.1 Pill Button

The default CTA element.

| Property | Value |
|---|---|
| Border-radius | `999px` |
| Padding | `6px 14px` |
| Font size | `12px – 13px` |
| Font weight | `500` |
| Border | none (primary) · `1px solid var(--border-subtle)` (ghost) |

**Variants:**

| Variant | Fill | Text | Glow |
|---|---|---|---|
| **Primary** | `radial-gradient(circle at top, #38bdf8, #0ea5e9)` | `#0f172a` (dark) | `0 0 18px rgba(56, 189, 248, 0.9)` |
| **Ghost** | `radial-gradient(circle at top, rgba(15, 23, 42, 0.8), ...)` | `var(--text-muted)` | none |
| **Disabled** | Same as variant, dimmed | `var(--text-muted)` | none · cursor `default` |

**Hover:** `translateY(-1px)`, `brightness(1.05)`, glow radius increases.
**Active:** `translateY(0)`, glow radius decreases.

**Anatomy (optional):**
Buttons may include a trailing icon (arrow, play symbol) via `::after`.

---

### 5.2 Glass Panel

Reusable container for any grouped content.

| Property | Value |
|---|---|
| Background | `rgba(15, 23, 42, 0.78)` |
| Border | `1px solid rgba(148, 163, 184, 0.4)` |
| Border-radius | `16px – 18px` |
| Backdrop-filter | `blur(10px)` – `blur(22px)` |
| Box-shadow | `0 10px 30px rgba(15, 23, 42, 0.7)` |
| Internal padding | `10px – 16px` |

Can contain headers, body sections, and footers as sub-regions.

**Speech-bubble variant:** Add a rotated square pseudo-element (`::after`) at the bottom edge, matching the fill color and border, to create a pointer/callout tail.

---

### 5.3 Status Indicator (Dot)

A small glowing circle for online/active/live states.

| Property | Value |
|---|---|
| Size | `8px – 9px` |
| Shape | `border-radius: 50%` (or `999px`) |
| Fill | `radial-gradient(circle, #22c55e, #166534)` |
| Glow | `box-shadow: 0 0 10px – 14px rgba(34, 197, 94, 0.9)` |

Semantic variants (future): swap green for amber (idle) or red (error), keeping the same gradient + glow pattern.

---

### 5.4 Interactive Card (Tile)

Large, tappable card for primary navigation or feature selection.

| Property | Value |
|---|---|
| Border-radius | `14px` |
| Border | `2px solid rgba(255, 231, 74, 0.95)` |
| Min-height | `188px` (desktop) / `148px` (tablet) |
| Padding | `20px 18px 14px` |
| Text-shadow | `0 0 8px rgba(255, 255, 255, 0.42)` |

**Background tint:** Each card can have an individualized `linear-gradient(135deg, <color-a>, <color-b>)` at low opacity (0.14 – 0.22). This gives personality while the border, glow, and hover unify them.

**Hover state:**
- `translateY(-4px) scale(1.03)`
- Unified cyan glow: `0 0 18px rgba(0, 242, 255, 0.58), 0 0 28px rgba(47, 140, 255, 0.42)`
- Optional sheen overlay via `::before` pseudo-element (`opacity 0 → 0.2`).

**Highlight / active state** (programmatic focus):
- Border switches to `var(--accent-primary)`.
- Multi-layered glow box-shadow with `outline: 2px solid` for reinforcement.
- Background overridden to a radial dark gradient.

**Inner anatomy:**
- `.tile-label` — Primary text (`24px`, weight `700`).
- `.tile-tag` — Pill-shaped category badge at bottom-left (`13px`, uppercase, `999px` radius, hairline border).

---

### 5.5 Identity Capsule

Compact user-info strip (avatar + metadata).

| Property | Value |
|---|---|
| Container padding | `6px 10px` |
| Container radius | `12px` |
| Container border | `1px solid rgba(148, 163, 184, 0.45)` |
| Container fill | `rgba(2, 6, 23, 0.72)` |
| Avatar size | `34px` circle |
| Avatar fill | `radial-gradient(circle at 30% 20%, #7dd3fc, #0284c7)` |
| Name text | `14px`, weight `600` |
| Sub-label | `12px`, `var(--text-muted)` |

The capsule sits inside a parent panel (e.g., header). It is an **inset** surface — darker than its surroundings with no blur of its own.

---

### 5.6 Tag / Badge

Small pill label for categorization.

| Property | Value |
|---|---|
| Font-size | `13px` |
| Text-transform | `uppercase` |
| Letter-spacing | `0.18em` |
| Padding | `4px 8px` |
| Border-radius | `999px` |
| Border | `1px solid rgba(255, 231, 74, 0.7)` |
| Fill | `rgba(2, 6, 23, 0.3)` |

Tags inherit border color from their parent's accent. If the parent uses cyan, the tag border should follow.

---

## 6 · Layout Patterns

### 6.1 Page Shell

```
┌─────────────────────────────────────────────┐
│  Header Bar  (Glass Panel, sticky/relative) │
├─────────────────────────────────────────────┤
│                                             │
│  Main Content Area                          │
│  (flex column, space-between)               │
│                                             │
├─────────────────────────────────────────────┤
│  Bottom Section  (grid / card group)        │
└─────────────────────────────────────────────┘
```

- Page wrapper: `min-height: 100vh`, `flex column`, `padding: 16px`.
- Background is a full-bleed layer (position `absolute`, `inset: 0`).
- Content sits at `z-index: 1+` above the background.

### 6.2 Grid System

Use CSS Grid for card groups:

| Breakpoint | Columns | Gap |
|---|---|---|
| Desktop (> 960px) | 4 | `12px` |
| Tablet (≤ 960px) | 2 | `12px` |
| Mobile (≤ 720px) | 1 | `12px` |

Columns use `minmax(0, 1fr)` to prevent overflow.

### 6.3 Centering & Alignment

- **Hero / featured areas:** `flex` with `align-items: center; justify-content: center`.
- **Header bar:** `flex`, `align-items: center`, `gap: 14px`. Push trailing items with `margin-left: auto`.
- **Card internals:** `flex column`, `justify-content: space-between` (label at top, tag at bottom).

---

## 7 · Background & Atmosphere

### Layered Background System

Atmospheric depth is built from stacked layers:

1. **Base gradient** — on `body`, dark radial gradient.
2. **Imagery layer** — full-bleed photo or illustration with a tinting overlay (`linear-gradient` mask).
3. **Atmospheric glow** — colored `radial-gradient` blobs at the bottom edge, blurred, at low opacity (0.3–0.4).

The imagery layer reacts to the cursor via parallax (see §4.3).

### Principles for Background on New Pages

- Always begin with the dark radial base gradient.
- Overlay imagery is optional — but if present, tint it dark enough that text remains legible without per-element text-shadows.
- Atmospheric glows at the page edges add cinematic drama. Use 2–3 color blobs; keep them below `opacity: 0.45` and blur at `6px+`.

---

## 8 · Responsive Breakpoints

| Name | Max-width | Key changes |
|---|---|---|
| **Tablet** | `960px` | Header wraps; grids → 2 columns; panels reflow. |
| **Mobile** | `720px` | Grids → 1 column; font sizes slightly reduced; imagery scales down. |

### Responsive Rules

- **Never hide content** at smaller breakpoints — reflow, don't remove.
- **Touch targets:** Minimum `44px` tap area on mobile.
- **Images:** Use fluid widths (`min(150px, 22vw)`) and let them shrink proportionally.

---

## 9 · Consistency Rules

### ✅ Do

- **Use tokens.** Reference `var(--accent-primary)` etc. — never raw hex in component CSS.
- **Follow the glass panel recipe** for every container that floats above the background.
- **Keep glow consistent.** Same radius/opacity ranges across the entire product.
- **Uppercase sparingly.** Reserve `text-transform: uppercase` for labels, tags, navigation, and titles — never for body paragraphs or long-form text.
- **Animate on interaction only.** Every animation should be a response to a user action or a subtle ambient loop — never a surprise.
- **Provide hover and active states** for every clickable element, no exceptions.
- **Test at all breakpoints.** Every new component must look intentional at desktop, tablet, and mobile.

### ❌ Don't

- **Don't use flat, opaque backgrounds** for panels — they will clash with the depth system.
- **Don't introduce new accent colors** without adding them as tokens and documenting their purpose.
- **Don't use rounded corners inconsistently.** If a card is `14px`, its siblings should be `14px`. Don't mix `8px` and `20px` on the same surface type.
- **Don't hard-code pixel widths** for containers — use `max-width` with fluid internals.
- **Don't animate layout properties** (`width`, `height`, `top`, `left`). Use `transform` and `opacity` for performance.
- **Don't add motion for its own sake.** If an animation doesn't guide the user's eye or provide feedback, remove it.
- **Don't use light backgrounds or white surfaces** — the design language is dark-mode-first. A light theme would be a separate, deliberate effort.
- **Don't use generic cursor.** The project uses a custom cursor asset; keep it consistent.

---

## 10 · Accessibility Roadmap

These are known gaps to address as the system matures:

- [ ] Add `focus-visible` styles to all interactive elements (use the neon glow ring as the focus indicator).
- [ ] Implement `prefers-reduced-motion` media query (see §4.4).
- [ ] Add ARIA roles and live regions for dynamically injected content.
- [ ] Ensure color contrast meets WCAG AA for all text-on-surface combinations.
- [ ] Ensure custom cursor does not impede usability — provide a fallback `pointer` or `auto`.

---

## 11 · Assets & Dependencies

### Runtime

- **No framework dependencies.** Pure HTML, CSS, and vanilla JavaScript.
- System font stack — no external font loading.

### Asset Directory (`assets/`)

Store all images, icons, and custom cursors here. Reference them with relative paths from the project root.

| Asset | Purpose |
|---|---|
| `background.jpg` | Page atmosphere backdrop (parallax layer). |
| `robot.png`, `robot_hi.png`, `robot_sad.png` | Mascot states (guide, greeting, negative feedback). |
| `mouse.png` | Custom cursor. |

---

## 12 · Extending the System

When building a new page:

1. **Start with the page shell** (§6.1) — background layers, header, main content area.
2. **Compose from atomic components** (§5) — panels, buttons, cards, tags.
3. **Apply tokens** (§2) — never invent new colors or shadows ad-hoc.
4. **Add page-specific elements** only after the foundation is in place. Document any new tokens or components back into this file.
5. **Test responsiveness** at 960px and 720px breakpoints.
6. **Verify hover/focus states** on every interactive element.

> **This document is a living artifact.** Update it whenever new tokens, components, or patterns are introduced. The goal is that any colleague can open this file and build a page that looks like it belongs in CiperQuest — without needing to reverse-engineer the existing CSS.
