# Pack 210 Pinewood Derby Theme Vote: Project Brief

A briefing for Claude Code. Start here, ask about anything marked **TBD**, and propose a plan before building.

## Goal

Build a fun, animated, mobile-first web page where Cub Scouts from Pack 210 (Dublin, Ohio) vote on this year's Pinewood Derby theme. Families get one link by email and BAND. The page should get kids excited about designing their cars, collect votes, and show a live **participation counter** without revealing which theme is winning. The winning theme is revealed at the **December pack meeting**.

## Audience and scale

- Fewer than 100 scouts. Expect low traffic: a few hundred page views and under 100 votes.
- Most visitors are parents on phones, often with a young child (ages 5–11) choosing.
- Families must **not** need any account or login to view or vote.

## Hosting and stack

- **Host:** Netlify Free plan. Low traffic keeps it well within free credits. Netlify Forms submissions are unlimited on the free plan, but this project uses Functions and Blobs instead so the page can show a live count.
- **Backend:** Netlify Functions for the server logic and Netlify Blobs for storage. No external database.
- **Frontend:** Plain HTML/CSS/JS or a light framework, whichever you recommend for a small, animation-heavy single page. Keep the bundle small for phones.
- **Animation:** GSAP or Motion for timelines and transitions, canvas-confetti for celebrations, and Lottie optional. Choose what fits and justify it.
- Check current Netlify docs for Functions and Blobs syntax before writing code.

## Core requirements

### Public voting page
1. **Hero/intro:** an animated opening that sets a race-day mood (cars racing down a track, checkered flags).
2. **Theme cards:** one card per theme with a name, a short kid-friendly description, and 3–4 example car ideas. Cards can flip or expand to show the ideas.
3. **Vote form:**
   - Scout's first name and last initial (required).
   - Den dropdown (required): Lions, Tigers, Wolves, Bears, Webelos, Arrow of Light.
   - Theme choice (required, one per scout).
   - A big, obvious "Cast my vote!" button.
4. **After voting:** a celebration animation, such as confetti or a car zooming across the screen with the scout's name. Then show a thank-you with a note that the winner will be revealed at the December pack meeting.
5. **Participation counter:** an animated count of how many scouts have voted, styled like a race-timer odometer. Pair it with a race-track progress bar where a car moves toward a finish line at the goal number. It refreshes every 5–10 seconds while the page is open.
6. **No per-theme results** on the public page or in any public API response.
7. **Voting closed state:** after the close date, hide the form and show a "Voting is closed, see you at the pack meeting!" message while keeping the final count visible.

### Private leader view
- A separate page, such as `/leader`, protected by a passcode.
- It shows per-theme totals, the total vote count, and a list of votes (scout name, den, theme, time) so leaders can spot duplicates.
- Ability to delete a single vote, such as a duplicate or test vote.
- Optional: download the votes as CSV.
- Optional: a "reveal mode" that animates the results for display on a projector at the December pack meeting.

## Backend design (suggested; refine as needed)

- **Storage:** Netlify Blobs store `theme-votes`. Store **one blob per vote** (`votes/<uuid>` → `{scoutName, den, theme, createdAt}`) rather than a single shared counter, so simultaneous votes can't overwrite each other. With under 100 votes, counting by listing keys is fine.
- **Functions:**
  - `POST /api/vote`: validate input and reject when voting is closed. Reject a duplicate when the same normalized scout name and den has already voted, with a friendly message. Store the vote and return `{ok, total}`.
  - `GET /api/count`: return only `{total, goal, closesAt}`. Never return per-theme data.
  - `GET /api/results`: requires the leader passcode in a header. Returns totals per theme and the vote list.
  - `DELETE /api/vote/:id`: requires the leader passcode.
- **Config via environment variables:** `LEADER_PASSCODE`, `VOTING_CLOSES_AT` (ISO date-time, America/New_York), `PARTICIPATION_GOAL`. Keep the theme list in one config file so it's easy to change next year.

## Duplicate-vote handling

No logins, so this is a best-effort check, which is fine for a kids' poll:
1. Server side: one vote per normalized scout name and den.
2. Client side: a "voted on this device" flag in localStorage that shows the thank-you screen on return visits. Allow a sibling to vote from the same device with a "Vote for another scout" button.
3. Leaders can review and delete duplicates in the leader view.

## Design and accessibility guardrails

- Mobile first. Animations must stay smooth on mid-range phones, so avoid heavy video backgrounds.
- Honor `prefers-reduced-motion` with calm, static versions of every animation.
- Keep the vote button the clear focus. The animation should support voting, not compete with it.
- Use large tap targets, readable fonts, and good contrast in light and dark mode.
- Write the copy for kids: short, upbeat, and easy to read aloud.
- Don't use Scouting America logos or trademarks. Original artwork only.

## Themes (final: see Decisions)

Past themes to avoid: Drive-In Movies (2020), Terrific TV Shows (2021), Video Games (2022), Creative Creatures (2023), Games and Hobbies (2024), Outer Space (2025), My Favorite Book (2026).

Candidates (shortlist leaning toward the first three):
- **Dinosaurs & Prehistoric Times**: T-rex racers, triceratops, fossils, volcanoes
- ✔ **Food on Wheels**: hot dog, pizza slice, taco, donut, sushi roll
- **Mythical Legends**: dragons, unicorns, griffins, krakens, Bigfoot
- When I Grow Up: fire truck, ambulance, chef, astronaut, crane
- Make-Your-Own Superhero: invent a hero with a name, colors, and powers
- Around the World: flags, landmarks, vehicles from other cultures
- Time Machines: chariot, Model T, hover car from the year 3000
- ✔ Under the Sea: submarines, sharks, pirate ships, coral reefs
- Sports Mania: baseball, football helmet, skateboard, favorite team
- Robots & Inventions: robots, gadgets, Rube Goldberg machines
- Camping & the Great Outdoors: campers, canoes, tents, campfires
- ✔ Monster Trucks & Wild Machines: bulldozers, tractors, trains, monster trucks

## Decisions (2026-11-11)

- **Final themes (3):** Food on Wheels, Under the Sea, Monster Trucks & Wild Machines.
- **Counting:** one vote per scout. Siblings each vote. Counter label: "N scouts have voted!"
- **Dates are flexible.** Don't hard-code a window. Leaders control the voting state from the leader page: *Coming soon* → *Open* → *Closed*, with an optional auto-close time. The site can sit deployed for days before launch.
- **Deadline:** the theme must be picked and a flyer made well before the December 16, 2026 pack meeting, so families can build before winter break.
- **Participation goal:** TBD until the roster arrives. Leaders can set it on the leader page without a redeploy.
- **Approval:** the committee approves both the video and the site before they go to families.
- **Theme card order:** shuffled for each visitor.
- **Art:** no existing artwork. All illustrations are original, made in code (SVG/CSS/canvas).
- **Passcodes:** a leader passcode for results and admin, plus a separate reveal passcode that unlocks only the animated reveal.
- **Hosting:** Netlify subdomain `pack210-derby.netlify.app` on a new Netlify account.
- **Repo layout:** one folder per year, `2027/theme-vote/` (site) and `2027/teaser/` (Remotion video).
- **Video:** two renders, a vertical 1080×1920 for BAND and a 16:9 1920×1080 for email and other uses. Made to work fully silent, with big text and visual storytelling, plus optional quiet sound effects. It's a hype video: it gets kids excited for Pinewood 2027, shows the three themes, and ends on the voting link.
- **Style:** ambitious, with one shared visual identity across the video and the site.

- **Winner reveal (decided 2026-11-11):** both. The winner goes on the printed flyer, and there's an optional reveal link. Leaders decide on `/leader/` whether to publish the reveal to families early or at the same time as the flyer. The closed-state copy points families to BAND and the flyer.
- **Den picker:** large tap-friendly den buttons instead of a dropdown, for easier use on phones.

## Still open

- The participation goal number, once the roster arrives. It's set on `/leader/`.

## Optional extras (nice to have, after the core works)

- A short **Remotion** teaser video (15–20 seconds, "Pinewood 2027… YOU pick the theme!") to post in BAND and email. Host it on YouTube or BAND rather than Netlify to save bandwidth.
- Open Graph image and title so the link previews nicely in BAND, texts, and email.
- Projector-friendly "reveal mode" for the December meeting.

## Workflow

1. Scaffold the project in this repo and keep it in git.
2. Use `netlify dev` to test the page and functions locally, including multiple votes, a duplicate vote, a closed-voting state, and the leader passcode.
3. Deploy with the Netlify CLI, or connect the repo to Netlify, and set the environment variables in the site settings.
4. Before sharing, test on a phone. Cast a test vote, confirm the counter updates, confirm `/api/count` exposes no per-theme data, then delete the test vote in the leader view.
5. Add a short README with deploy steps and how to change the themes and dates for next year.
