# The Lighthouse: Script & Storyboard

A 30-second short film. This file is the **plan**: every shot, what you see,
what you hear, and how each shot will be made.

---

## 1. The idea (logline)

> An old lighthouse keeper has shone her light every night for forty years
> for ships that never come. Tonight, something answers.

**Mood:** lonely, quiet, then a spark of hope.
**Colors:** cold blue-grey (like our title card), with the one warm thing
being the lighthouse lamp.

---

## 2. The script (narration)

Spoken slowly by a calm, older voice. About 35 words, so there's room to breathe.

| Time | Words |
|---|---|
| 0:05 | *"For forty years, she kept the light."* |
| 0:09 | *"Every night, the same stairs. The same lamp."* |
| 0:13 | *"Every night, the beam crossed empty water."* |
| 0:17 | *"No ship had come in a very long time."* |
| 0:22 | *"Until tonight."* |

---

## 3. The storyboard (shot by shot)

| # | Time | Length | What you SEE | Camera | What you HEAR | How it's made |
|---|---|---|---|---|---|---|
| 1 | 0:00–0:05 | 5s | Title: **THE LIGHTHOUSE** on dark blue, letterbox bars | Slow push-in | Drone + whoosh | 🟢 Way 1: **already made!** (`01-title-card`) |
| 2 | 0:05–0:09 | 4s | A lighthouse on a cliff at dusk, storm clouds, waves crashing below | Wide shot, slow drift right | Waves, wind, narration starts | 🔴 Way 3 (AI) · or 🟡 Way 2 (stock) |
| 3 | 0:09–0:13 | 4s | Old hands turning a brass key; a lamp flickers on, warm orange glow | Close-up, still | Click of the key, soft hum | 🔴 Way 3 · or 🟡 Way 2 (**film your own hands on iPad!**) |
| 4 | 0:13–0:17 | 4s | The beam sweeps slowly across a dark, empty sea | Wide, still | Low drone, distant waves | 🟢 Way 1: **made!** (`make_code_shots.sh`) · AI upgrade optional |
| 5 | 0:17–0:21 | 4s | Keeper's silhouette at a rain-streaked window, looking out | Medium shot from behind | Rain on glass, narration | 🔴 Way 3 · or 🟡 Way 2 (stock) |
| 6 | 0:21–0:25 | 4s | Far on the black horizon, a tiny light blinks back. Once. Twice. | Very slow push-in toward the dot | Everything goes quiet → *"Until tonight."* | 🟢 Way 1: **made!** (`make_code_shots.sh`) |
| 7 | 0:25–0:30 | 5s | End card: **THE LIGHTHOUSE** · *coming soon* | Fade in, fade out | Drone swells, then silence | 🟢 Way 1: reuse our title card code |

**Total: 30 seconds** (5 + 4 + 4 + 4 + 4 + 4 + 5).

### Film words used above
- **Wide shot**: shows the whole scene; tells you *where* you are.
- **Medium shot**: a person from the waist up, or a room; tells you *who*.
- **Close-up**: one small detail filling the screen; tells you *what matters*.
- **Silhouette**: a dark shape against a bright background.
- **Drift / push-in**: slow camera movement sideways / forward.

---

## 4. Two ways to make it

### 🟢🟡 The free path
| Shot | Free method |
|---|---|
| 1, 7 | Our title card code (done) |
| 2, 5 | Free stock clips from Pexels or Pixabay. Search: *"lighthouse storm"*, *"rain window night"* |
| 3 | Film your own hands on your iPad: a key, a lamp or candle, dark room |
| 4, 6 | Make with code: dark sea, a sweeping beam, a blinking dot |
| Voice | Record yourself on the iPad (Voice Memos app) |
| Sound | Generated with FFmpeg (like our drone) + free sound effects |

**Cost: $0.** Looks less "Hollywood," but you learn every skill.

### 🔴 The AI path
Shots 2, 3, 4, 5 (and maybe 6) made with an AI video service.
- About **4–5 AI clips**, each 4–5 seconds.
- Plan for **2–3 tries per shot** (AI results vary), so **about 10–15 generations**.
- Prices change often and differ by service. **Check the current price before
  generating anything.**

**A smart mix:** do the free path first, then replace only the one or two
shots that look weakest with AI.

---

## 5. Ready-to-use AI prompts (for later)

A good video prompt answers: **shot type + subject + action + place + light + camera + style.**

**Shot 2:**
> Wide shot of a lone white lighthouse on a rocky cliff at dusk, storm clouds
> rolling in, waves crashing against the rocks below, cold blue-grey light,
> camera drifts slowly to the right, cinematic, 35mm film look.

**Shot 3:**
> Close-up of an elderly woman's weathered hands turning a brass key on an old
> lighthouse lamp, the lamp flickers on with a warm orange glow, dark room,
> static camera, shallow depth of field, cinematic.

**Shot 4:**
> Wide shot at night of a lighthouse beam sweeping slowly across a dark, empty,
> calm sea, mist over the water, cold blue tones, static camera, cinematic.

**Shot 5:**
> Medium shot from behind of an elderly woman's silhouette at a rain-streaked
> lighthouse window at night, looking out at the dark sea, raindrops on glass,
> moody blue light, static camera, cinematic.

**Shot 6:**
> Extreme wide shot of a pitch-black ocean horizon at night, a single tiny
> light far away blinks twice, very slow push-in, minimal, cinematic.

---

## 6. Checklist

- [x] Idea
- [x] Script
- [x] Storyboard
- [x] Shot 1: title card
- [x] Choose: **mix path** (free first, AI upgrades for the weakest shots)
- [x] Shots 4 and 6: made with code
- [ ] Collect / make shots 2, 3, 5
- [ ] Record narration
- [ ] Shot 7: end card
- [ ] Edit everything together
- [ ] Export the final 30-second film
