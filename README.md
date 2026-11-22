# VELVET HOUR — steal the Moon Opal from the Galleria Nocturne

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/cervus-snoopy/velvet-midnight-opal-4f8z/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/cervus-snoopy/velvet-midnight-opal-4f8z/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist in a single moonlit gallery. You are the thief in
the dark coat and white scarf. Cross the Galleria Nocturne, lift the glowing
Moon Opal from its pedestal, and slip out the service door — before the
guards, the cameras, and the alarm meter end your night.

## Play

- **Move** — WASD or arrow keys. **Shift** sneaks: slow, quiet, harder to spot.
- **Coin** — click (or press 1) to throw a coin. The nearest guard walks over
  to look, and stops watching you.
- **Smoke** — press 2 for a puff that breaks every line of sight for 3 seconds.
- **EMP** — press 3 to kill both cameras for 10 seconds.
- **Win** — grab the Moon Opal, then reach the service door. **Lose** — a
  guard touches you, or the alarm hits 100 and the gallery locks down.

## The gallery

Three guards walk fixed patrols, sweeping yellow vision cones that turn red
when they are sure of you. Two cameras on the walls sweep red cones and feed
the alarm meter. The fountain, the display pedestals, and the potted palms
block sight — the velvet ropes only block feet. Three routes cross the room:
the velvet carpet on the left, the fountain in the middle, the statue garden
on the right — each under different watch.

Getting caught is fair: full suspicion is a **SPOTTED!** warning with a
short grace window to break line of sight. Only standing in the open when
it runs out ends the run.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files, `game/index.html`
and its ES modules. Screenshots in `screenshots/` are real renders of this
code, staged deterministically from `game/src/shots.js` (`?shot=heist&seed=1`
and friends, listed in `shots.json`).

## Files

- `main.ts` — the hand-in: copies `game/` and `screenshots/` to the output
  directory and writes `dossier.json`.
- `game/index.html` — canvas + status line, loads `./src/main.js`.
- `game/src/config.js` — the room, patrols, cameras, tools, tuning.
- `game/src/random.js` — seeded RNG for deterministic scenes.
- `game/src/world.js` — state + rules: thief, guards, cameras, loot, alarm.
- `game/src/input.js` — keyboard + mouse.
- `game/src/render.js` — everything drawn on the canvas.
- `game/src/shots.js` — deterministic screenshot scenes.
- `game/src/main.js` — game loop + screens (title / play / caught / win).

## License

MIT — see [LICENSE](LICENSE).
