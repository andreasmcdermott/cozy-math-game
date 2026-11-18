# Move Paws & Potions to Cloudflare Pages

This preparation targets Cloudflare Pages Direct Upload. It creates a public static game with no ChatGPT sign-in, backend, database, or player account. The parent needs a Cloudflare account to deploy; the child only needs the finished HTTPS URL.

No Cloudflare project has been created or deployed by these preparation steps. The existing ChatGPT Sites copy and its access settings are unchanged.

## What is ready

- wrangler.jsonc names the Pages project and deployable dist/ directory.
- npm run cloudflare:prepare runs the game/save tests, builds the site, and checks the Pages deployment contracts.
- npm run cloudflare:preview runs Cloudflare's local Pages emulator on http://127.0.0.1:4181 without publishing.
- cloudflare/headers.template sets same-origin security rules and cache headers. The build writes dist/_headers, including the exact versioned module directory.
- The offline worker precaches the canonical / URL, not /index.html, and excludes Pages control files. Pages does not serve _headers as an ordinary asset.
- Settings → Back up or restore progress downloads or restores a portable saved-game file. Import shows a summary and requires an explicit replacement action.

Wrangler 4.164.0 is pinned in scripts/cloudflare.mjs and downloaded by npx when needed. It is deployment tooling only; the game and its build remain dependency-free. Use Node.js 22 or newer. No npm install is required for this repository.

## Deploy when ready

1. Review the project name in wrangler.jsonc. The default is paws-potions-math. If that name is unavailable, change it before creating the project; all helper commands read this file.
2. Authenticate as the parent:

   ```sh
   npm run cloudflare:login
   ```

3. Create the Pages project once. Skip this command if it already exists in the selected account:

   ```sh
   npm run cloudflare:create
   ```

4. Publish the checked build:

   ```sh
   npm run cloudflare:deploy
   ```

   This runs the tests and build again, then uploads dist/ to the project's production branch, main. Wrangler prints the real deployment URL. Do not treat local emulator URLs or example pages.dev addresses as proof of a live deployment.

The game is intended to open anonymously. Do not add Cloudflare Access sign-in to its player-facing URL. If you want a custom domain, configure it in the Pages dashboard before she starts playing, so another origin move is unnecessary.

### Dashboard upload alternative

The prepared archive is release/paws-potions-cloudflare.zip. It contains index.html and _headers at the ZIP root, ready for Pages Direct Upload. Upload it through the Cloudflare Pages dashboard if you prefer that to Wrangler. To rebuild it after changes, run npm run cloudflare:zip. ZIP packaging uses Python 3's standard library; the normal build and Wrangler deployment do not require Python.

For noninteractive CI later, keep CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the CI secret store. Never put them in this repository or the static build. The helper inherits the normal Wrangler environment and disables Wrangler metrics.

## Move existing progress

Saves belong to a browser **and the exact site origin**. A pages.dev URL cannot read the old chatgpt.site storage. A future custom domain is also a different origin. Signing in to the same parent account does not transfer local saves.

### From a version with backup controls

1. On the old address, open Settings → Back up or restore progress → Download saved game.
2. On the new address, open the same panel and choose the downloaded file.
3. Check the previewed coin, potion, and familiar counts, then choose Replace saved progress.

The file includes the equipped and parked familiar puzzles, per-familiar recipe progress, coins, pets, every personal room’s furniture ownership/display choices, difficulty, and settings. It contains game state, not browser cookies or account credentials. Invalid or unsupported files are rejected before changing the current game. Keep the file until the new save has survived a reload.

### From the currently published older Sites version

That version predates the backup button. Use its browser developer console on the old game page and run this once to download the game state:

```js
(() => {
  const raw = localStorage.getItem('paws-potions-v1');
  if (!raw) throw new Error('No saved game was found in this browser.');
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'paws-potions-save.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
})();
```

Then restore this file on the new Cloudflare address using the backup panel. Raw saves from older game schemas are supported and migrated. Do this in the browser/device that actually holds the progress. If there is no progress to move, start a new game on the new address.

## Cutover check

Before using the new URL on the iPad:

- Open it in a signed-out/private browser. It should show the game without a ChatGPT or Cloudflare login.
- Brew a potion, reload, and check the reward and next puzzle.
- If transferring progress, verify coins, active familiar, furniture, and difficulty after import and reload.
- Let the offline cache finish, then reopen the page offline. The help dialog reports when it is ready.
- In Safari, add the new address through Share → Add to Home Screen. Replace the old Home Screen shortcut, which still points to the old origin.

Keep the old private deployment available until the transfer is checked. This preparation does not disable or delete it.

## Updating and rollback

Run npm run cloudflare:deploy for later updates. Versioned app paths prevent old service workers from mixing incompatible modules. HTML, the worker, and mutable artwork/font paths revalidate; content-versioned code is immutable. All game assets and fonts are local.

Use the Pages dashboard to roll back a production deployment if necessary. Before rolling game code back across save-schema changes, download a progress backup. An older game may not understand newer saves.

## Reference

- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/)
- [Wrangler Pages configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)

The deployment workflow is also checked using the pinned Wrangler CLI's command help and local Pages emulator. Actual account authentication, project creation, production deployment, and real iPad hardware verification remain separate from this preparation.
