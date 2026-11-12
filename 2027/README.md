# Pinewood 2027 (Pack 210)

| Folder | What it is |
| --- | --- |
| [`shared/`](shared/) | **Themes, dens, and car artwork.** Used by both the site and the video. Edit `themes.js` to change themes. |
| [`theme-vote/`](theme-vote/) | The voting site (Vite + GSAP, Netlify Functions + Blobs). Live at `pack210-derby.netlify.app`. |
| [`teaser/`](teaser/) | The Remotion hype video (vertical for BAND, 16:9 for email) and the link-preview image. |

---

## Voting site

### Pages

- `/`: the public voting page. It shows the live participation count and never per-theme results.
- `/leader/`: the leader pit lane. With the leader passcode you can open or close voting, set an auto-close time, set the goal, see results, delete votes, download a CSV, and publish the reveal.
- `/reveal/`: an animated race to the winning theme. It looks good on a projector or a phone.
  - **Leaders** can preview it any time with the leader passcode.
  - After voting closes, anyone with the **reveal passcode** can open it.
  - If a leader turns on **Publish**, every family can open it with no passcode, and the home page shows a "See the winner!" button.

### Voting states (set on `/leader/`, no redeploy needed)

1. **Coming soon** (the default): families can browse the themes but can't vote. Use this while the committee reviews the site.
2. **Open**: voting is live. You can optionally set an auto-close time.
3. **Closed**: the form is hidden and the final count stays on screen.

### Run it locally

```bash
cd 2027/theme-vote
npm install
cp .env.example .env      # then fill in test passcodes
npm run dev               # netlify dev → http://localhost:8899
```

`netlify dev` runs the functions and a local, sandboxed Blobs store, so local test votes never touch the real site.

**Starting over locally:**

```bash
npm run reset              # wipe local votes AND settings (back to "Coming soon")
npm run reset -- --votes   # wipe votes only; keep state, goal, and reveal settings
```

These commands work while the dev server is running. Also click **Dev only: reset this device** at the bottom of the home page. It clears what your browser remembers (who voted on this device, saved passcodes), so you see the vote form again. The button only exists in local dev and is never on the live site.

### First deploy (one time)

1. In Netlify, choose **Add new project → Import an existing project → GitHub** and pick this repo.
2. Set **Base directory** to `2027/theme-vote`. The build command (`npm run build`), publish folder (`dist`), and functions come from `netlify.toml`.
3. Under **Project configuration → General → Change project name**, set the name to `pack210-derby` so the URL is `pack210-derby.netlify.app`.
4. Under **Project configuration → Environment variables**, add:
   - `LEADER_PASSCODE`: for leaders (results and admin)
   - `REVEAL_PASSCODE`: for the reveal page only
5. Deploy. Netlify Blobs needs no setup. Votes are saved in a store called `theme-votes-2027`.
6. Open `/leader/`, confirm it says **Coming soon**, and set the goal once you have the roster.

### Before sending the link

On a phone:

1. Set the state to **Open** and cast a test vote.
2. Watch the counter go up.
3. Confirm that `/api/status` shows only `total` and `goal`.
4. Delete the test vote on `/leader/`.
5. Set the state back to **Coming soon** until launch day.

### Next year / car voting

- Copy `2027/` to `2028/`, edit `shared/themes.js`, and change `STORE_NAME` in `theme-vote/netlify/lib/core.mjs`.
- To reuse `pack210-derby.netlify.app` for a different project (for example car voting), change the Netlify **Base directory** to the new folder. The old project stays in git, and its votes stay in its own Blobs store.

---

## Hype video

```bash
cd 2027/teaser
npm install
npm run studio        # preview and scrub in the browser
npm run render        # builds all three outputs below
```

| Output | Use |
| --- | --- |
| `out/pinewood-2027-band-vertical.mp4` | 1080×1920, for BAND (phones). About 32 seconds, with a ~2-second pause before each transition. |
| `out/pinewood-2027-wide.mp4` | 1920×1080, for email, YouTube, or a projector. Same timing as the vertical. |
| `../theme-vote/public/og.png` | Link preview image for BAND, texts, and email |

`npm run render:short` builds the fast 20-second cuts (`*-20s.mp4`). They're smaller files, in case BAND has a size limit. The pause length is `HOLD` in `src/Hype.jsx`.

- **Sound:** it's made to work fully silent. Quiet sound effects are mixed low. They're generated from scratch by `npm run sfx` (ffmpeg), so there are no licensing questions.
- **Timing:** base scene lengths are `BASE` in `src/Hype.jsx`.
- **Licensing:** Remotion is free for individuals and small non-profits. See remotion.dev/license.
