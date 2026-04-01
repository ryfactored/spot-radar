# Design System: High-End Editorial Audio Experience

## 1. Overview & Creative North Star

**Creative North Star: "The Neon Nocturne"**

This design system moves beyond the utility of a standard music player into the realm of a high-end digital editorial. While it pays homage to the dark-mode origins of audio streaming, it rejects the "flat list" mentality. Instead, we embrace **The Neon Nocturne**: an aesthetic defined by deep, obsidian layering, vibrant chromatic accents, and an intentional use of "Negative Space as Luxury."

We break the template look by using **Intentional Asymmetry**. Album art shouldn't always be a centered square; it should bleed off-edges or sit at unexpected intersections of the grid. We use high-contrast typography scales—pairing massive, confident displays with microscopic, high-utility labels—to create a rhythmic visual flow that mimics the music itself.

---

## 2. Colors & Surface Philosophy

The palette is rooted in absolute depth, using `background (#0e0e0e)` as our canvas. We do not use "gray" to create separation; we use light and opacity.

### The "No-Line" Rule

**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning.

Boundaries must be defined solely through background color shifts. To separate a "New Releases" section from the main feed, shift from `surface` to `surface-container-low`. The transition should be felt, not seen.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers—like stacked sheets of smoked glass.

- **Base:** `surface` (#0e0e0e)
- **Secondary Sections:** `surface-container` (#1a1a1a)
- **Interactive Cards:** `surface-container-high` (#20201f)
- **Floating Overlays:** `surface-container-highest` (#262626) at 80% opacity with a `20px` backdrop blur.

### The "Glass & Gradient" Rule

To inject "soul" into the interface, avoid flat-filled primary buttons. Use a linear gradient for main CTAs:

- **Primary Action:** `primary_dim` (#8455ef) to `primary` (#ba9eff) at a 135-degree angle.
- **Glass Elements:** Use `surface_variant` at 40% opacity with a heavy `blur` for any element that floats above imagery (e.g., player controls over album art).

---

## 3. Typography: The Editorial Rhythm

We utilize two distinct voices to create a sophisticated hierarchy: **Plus Jakarta Sans** for expressive moments and **Manrope** for technical clarity.

- **The Hero Voice (Plus Jakarta Sans):** Use `display-lg` and `headline-lg` for artist names and playlist titles. These should be set with tight tracking (-2%) to feel "heavy" and authoritative.
- **The Utility Voice (Manrope):** Use `body-md` and `label-sm` for track durations, metadata, and secondary navigation.
- **Hierarchy Tip:** Pair a `display-md` title with a `label-md` uppercase subtitle in `primary` (#ba9eff) to create a premium magazine feel.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "software-standard." We use **Atmospheric Depth**.

- **Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. The subtle shift in hex code creates a "soft lift" that feels organic to the screen.
- **Ambient Shadows:** If an element must float (like a Play bar), use a shadow color derived from `surface_tint` (#ba9eff) at 5% opacity, with a `48px` blur. It should look like a glow, not a shadow.
- **The "Ghost Border" Fallback:** If accessibility requires a container edge, use `outline-variant` (#484847) at **15% opacity**. It must be a suggestion of an edge, not a hard line.
- **Glassmorphism:** Navigation bars and player overlays must use `surface-container-highest` with a `backdrop-filter: blur(12px)`. This allows the vibrant album art colors to bleed through the UI, ensuring the app feels "Spotify-adjacent" but more immersive.

---

## 5. Components

### Buttons

- **Primary:** Gradient (`primary_dim` to `primary`), `xl` (1.5rem) roundedness. Text is `on_primary_fixed` (Black) for maximum punch.
- **Tertiary (Ghost):** No background. `title-sm` typography in `on_surface_variant`. On hover, shift to `on_surface`.

### Cards & Playlists

- **The Card Rule:** Forbid divider lines. Use `surface-container-high` for the card body.
- **Image Handling:** Album art must always use `lg` (1rem) corner radius. For "Featured" items, allow the image to scale slightly (1.05x) on hover.

### Progress Bars & Sliders

- **Track:** `surface-variant`.
- **Active State:** `secondary` (#6df5e1).
- **Knob:** No shadow. Use a simple `secondary` circle that expands slightly when interacted with.

### Innovative Component: The "Contextual Aura"

When a track is playing, apply a large, blurred radial gradient in the background (30% opacity) using the `primary` or `secondary` token to match the vibe of the music.

---

## 6. Do's and Don'ts

### Do:

- **Do** use asymmetrical margins. A left margin of `8` (2rem) and a right margin of `12` (3rem) can create a high-fashion editorial look.
- **Do** lean into the `tertiary` (#ff97b5) color for "Heart" or "Like" actions—it provides a sophisticated "Electric Pink" contrast to the deep purples.
- **Do** use `6` (1.5rem) or `8` (2rem) spacing between content groups to allow the UI to breathe.

### Don't:

- **Don't** use 100% white (#ffffff) for long-form body text. Use `on_surface_variant` (#adaaaa) to reduce eye strain against the black background.
- **Don't** use `DEFAULT` roundedness for large containers; use `xl` or `full` for a "sleek companion" feel.
- **Don't** ever use a solid black (#000000) for a card sitting on a black background; use the `surface-container` tiers to define the object.
