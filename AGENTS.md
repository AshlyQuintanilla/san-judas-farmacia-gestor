<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Pages read data only through `src/services/queries.ts` and write through `src/services/*.service.ts`; swapping the temporary in-memory source (`src/services/data-source.ts` + `src/data/mock-data.ts`) for the real database must not require page changes.
- Domain types live in `src/lib/types.ts` and mirror `docs/supabase/esquema-propuesto.sql`; keep both in sync.
- Business rules (low stock, sale totals, stock validation, expiry) are pure functions in `src/lib/business-rules.ts`, covered by `src/test/business-rules.test.ts`.
- Currency, locale and thresholds come from `src/lib/config.ts`; never hardcode a currency symbol elsewhere except chart axis labels derived from it.
- Auth is a temporary mock (`src/services/auth.service.ts` + `src/lib/auth.tsx`); signed-in pages live under the pathless `_authenticated` layout, which redirects to `/` (login) when there is no session.
