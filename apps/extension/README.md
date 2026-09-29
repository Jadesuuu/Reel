# Reel browser sources

A Manifest V3 Chrome extension that reads HiringCafe and Wellfound from inside your browser
and hands the jobs to Reel. Both sites sit behind bot protection that blocks a server, but a
page loaded in your own Chrome comes back with the jobs embedded in it.

## How it works

1. Reel's worker treats `HIRINGCAFE` and `WELLFOUND` like any other source, but instead of
   fetching it records an ingest run in the `WAITING` state.
2. Every 30 seconds the extension's service worker calls `POST /browser/poll` with your
   browser token. Reel marks waiting runs as `RUNNING` and returns them.
3. For each run the extension opens the site in a background tab, reads the `__NEXT_DATA__`
   script the page ships with, moves to the next page, and closes the tab. Up to three pages
   per run; HiringCafe stops early once it reaches jobs older than the previous run.
4. It posts the trimmed hits to `POST /browser/runs/:id/complete`. Reel maps, normalises,
   dedupes and scores them exactly like a feed.

If a site shows a "verify you are human" check, the tab comes to the front so you can click it.
The run waits up to two and a half minutes for that. Chrome has to be open for any of this to
happen; a run nobody picks up fails after fifteen minutes with "No browser connected".

The same poll also returns how many strong matches (score 80 or more) Reel has scored since you
last opened the inbox. That number sits on the toolbar icon, and each new batch raises one
Chrome notification naming the top three. Clicking the icon or the notification opens the
inbox, which clears the count on the next poll.

## Load it

```
pnpm --filter extension build
```

Then in Chrome: `chrome://extensions`, turn on Developer mode, Load unpacked, choose
`apps/extension/dist`. Right-click the Reel icon in the toolbar and choose Options, paste the
API address and the token from Settings → Sources → Your browser, and save. The web address
below them is where the icon and notifications open the inbox; leave it at
`http://localhost:3000` for a local Reel. Rebuild and press the reload icon on the extension
card after changing the code.

The API address defaults to `http://localhost:4000/api/v1`. A deployed API needs its origin
allowed once; the options page asks Chrome for that permission when you save.
