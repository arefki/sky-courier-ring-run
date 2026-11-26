# Sky Courier: Ring Run — build notes

## The idea
I wanted a flight game that feels like flying, not like a menu with a plane
pasted on it. So I built a chase-view arcade flyer: you are a courier pilot
in a little prop plane, crossing a procedural valley. There is a course of
twelve glowing rings strung along a winding valley floor — fly through each
one to score and buy more time — and when the last ring is done, the job is
not over: you have to turn around, find the runway in the golden-hour light,
and put the plane down on the strip to finish. Three lives, a 150-second
clock that only rings can extend, wind gusts on the late rings, and a stall
if you get too slow. It is a complete loop: take off, race, land.

## What I made
- `game/game.js` — the whole game in one file, about 45 KB. Pure Canvas 2D
  with a small software 3D projector I wrote for it: the terrain is a
  heightfield (rolling hills, a river, patchwork fields, a road, mountains
  at the valley edges, and a flat runway strip), rendered far-to-near as
  projected quads with distance haze. The plane is drawn in screen space
  from behind, banking with your turns, prop disc spinning, nav lights
  blinking, gear down on final. The HUD is all drawn in-canvas: altitude,
  speed, heading, vertical speed, a scrolling compass tape, an attitude
  indicator, throttle bar, score, rings, timer and lives, plus a guide
  arrow that points at the next ring (or the runway) when it is off-screen.
- `game/index.html` + `game/style.css` — a fullscreen canvas page, nothing
  else. No libraries, no network requests, no external assets at all.
- Sound is synthesized with WebAudio (engine drone, wind, ring chime, crash
  thud) — no audio files. M mutes.
- Controls: arrow keys pitch and bank, W/S throttle, the mouse steers too,
  P pauses, R restarts, Enter or click starts.
- `main.ts` is the kit starter's hand-in program, unchanged: it copies
  `game/` and `screenshots/` and writes `dossier.json` with the vendored
  `vendor/makefun-game.ts`.
- `shots.json` lists the four staged views the screenshots were taken from.

## How I tested it
I served the game locally and drove it in headless Chrome. I built a
`?selftest=1` mode into the game itself: it checks the terrain is finite
and the runway is flat, checks the projection never returns NaN, then flies
the course with a simple autopilot for 90 seconds of game time and reports
what happened, and finally draws one full frame (sky, terrain, rings,
plane, HUD) to prove the render path runs without throwing. In the run I
did, all six checks passed: the autopilot cleared 9 of 12 rings with zero
crashes and a score of 900, which tells me the course is fair — hard
enough to be a game, not so hard that a careful player cannot finish it.

The four screenshots are real renders of the game's own code, taken in
headless Chrome at 1280×800 through the `?shot=` scenes the game provides
(title, mid-course ring chase, low river pass, golden-hour final
approach). Two of them caught real bugs while I was looking at them: the
terrain grid was built in absolute z, so on the return leg back to the
runway almost no ground rendered ahead of the plane, and the runway strip
was narrower than one terrain quad so it almost never landed on a quad
centre and stayed invisible. I fixed both — the grid is now built in
camera space, and narrow features are tested by quad overlap — re-ran the
self-test (still all passing) and re-shot until the runway showed as a
proper grey strip with threshold bars.
