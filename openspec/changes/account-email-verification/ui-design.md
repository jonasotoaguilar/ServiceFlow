# UI Design: account-email-verification

## Surfaces and mode

Operate. Login callout and resend **inherit** the existing auth card. `/verify` is a small **extend** of that same centered auth world. No concept/comp round. No `design/chosen.yaml`. Root `PRODUCT.md` / `DESIGN.md` stay frozen.

## Direction and hierarchy

Workshop-bright, compact, zinc + ink `#2F5B8A`. Squint order: brand lockup → title → status callout → form or login link. The verification message is informational, not a marketing banner. No new gradients, tokens, or brand marks.

## Composition

Reuse the incumbent auth card: `max-w-[450px]`, `bg-surface`, `border-border`, `rounded-xl`, centered in `min-h-screen`. Callout sits **above** the login fields when `registered=1`. Resend is a full-width secondary control under the primary submit, not a toast. `/verify` uses the same card with one Alert and a text link to `/login`. No extra chrome.

## Type, color, material

No new fonts, hues, radii, or shadows. Fira Sans body/label. Alerts use existing `components/ui/alert.tsx` variants: **info** (post-register callout, resend ack), **success** (`/verify?status=ok`), **error** (`/verify?status=fail` and login errors). Do not invent a fourth visual language.

## Identity / brand

Unchanged. Existing 16×16-in-card lightning/refresh marks stay. `/verify` uses the same primary tile as login.

## Interaction and motion

Keep `router.push` + `router.refresh` on login and register. Register success goes to `/login?registered=1` (non-sensitive query). Resend does not navigate. `/verify` never renders the token; the RSC redirects to `?status=ok|fail`. Motion stays 150–200ms opacity only; honor `prefers-reduced-motion`. Resend and links: keyboard reachable, visible 2px `#2F5B8A` focus, **44px** min hit target.

## States

- **Post-register:** visible info Alert: "Te enviamos un correo de verificación. Debes verificar tu cuenta antes de iniciar sesión."
- **Resend ack (all emails):** info Alert: "Si el correo está registrado y pendiente de verificación, te enviamos un enlace."
- **Login failure (unknown, wrong password, unverified):** same error Alert "Credenciales inválidas" plus the always-visible resend control. No extra unverified-only copy.
- **Verify ok:** success Alert "Tu correo fue verificado. Ya puedes iniciar sesión." + link "Inicia sesión".
- **Verify fail / missing token:** error Alert "El enlace no es válido o expiró. Solicita uno nuevo e inicia sesión." + link "Inicia sesión".
- Loading: existing `Loader2` on submit/resend; disable duplicate clicks.

Add `role="alert"` and `aria-live="polite"` on `Alert`. Do not log or display the token.

## Design-system delta

None to promote. Alert a11y attributes are local reuse, not a new variant. Archive may note the auth callout pattern; do not edit root `DESIGN.md` in this change.

## Verification

390×844 and 1280×800: callout readable in the card without overflow; resend ≥44px; `/verify` success/fail Alerts contrast AA; focus ring visible; no token in the visible URL after redirect.
