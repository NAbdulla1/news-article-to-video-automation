# news-scrapper

## Run
- Install dependencies: `pnpm install`.
- Install browsers: `pnpm exec playwright install chromium chromium-headless-shell`.
- Run `pnpm start`.

## Unit testing
 - Open the project in VS Code dev container
   - Open the folder in VS Code, install the 'Dev Container' extension(from Microsoft) and choose 'Reopen in Container' from notification
 - execute `npm install`, or `pnpm install`
 - execute `npm run test` or `pnpm test`
 - sometimes it is necessary to install the playwright binary manually(though docker should install it automatically, using `pnpm exec playwright install chromium chromium-headless-shell --with-deps` or `npx playwright install chromium-headless-shell --with-deps`
