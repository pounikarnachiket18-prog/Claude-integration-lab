# AI Upgrade Plan: The Lighthouse

**Goal:** decide which shots are worth improving with an AI video service, and
what it would cost, **before spending anything**.

> ⚠️ Prices below come from third-party price guides (November 2026), and the
> guides often disagree with each other. **Always check the service's own
> pricing page right before you pay.** Treat every number here as a rough range.

---

## 1. Which shots are worth upgrading?

| # | Shot | Current version | AI good at this? | Upgrade value | Decision |
|---|---|---|---|---|---|
| 1 | Title card | Code | ❌ AI often scrambles text | None | **Keep code** |
| 2 | Lighthouse in storm | Code (stylized) | ✅ Landscapes, clouds and sea are AI's strength | ⭐⭐⭐ High | **Upgrade first** |
| 3 | Hands and lamp | Placeholder | ⚠️ AI often draws hands wrong | Medium | **Film on iPad first**; AI only as backup |
| 4 | Sweeping beam | Code | ✅ Good | ⭐⭐ Medium | Upgrade only if 2 and 5 are upgraded |
| 5 | Keeper at window | Code (stylized) | ✅ Silhouettes from behind (no face) are easy for AI | ⭐⭐⭐ High | **Upgrade second** |
| 6 | Answering light | Code | Not needed (it's almost all black) | Low | **Keep code** |
| 7 | End card | Code | ❌ Text again | None | **Keep code** |

### The style question ⚠️
If **one** shot looks like a real photo and the others look like drawings, the
film will feel patched together. So choose one:
- **Stay stylized:** keep all code shots. Free, and consistent.
- **Go realistic:** upgrade **2, 4 and 5 together** (and film Shot 3), keeping
  6 and the title cards as they are. They're dark and minimal, so they still fit.

**Recommendation:** test Shot 2 first (for free if possible). If it looks great,
go realistic for 2, 4 and 5.

---

## 2. How much footage do we need?

Each shot is 4 seconds, but most services make clips of **at least 5 seconds**,
and AI rarely gets it right the first time, so plan **3 tries per shot**.

| Plan | Shots | Seconds to generate (5s × 3 tries per shot) |
|---|---|---|
| Test | 2 | 15 s |
| Small | 2 + 5 | 30 s |
| Full realistic | 2 + 4 + 5 | 45 s |

**We don't need AI sound.** We make our own soundtrack, so choose the
**silent / no-audio** option, which is usually cheaper.

---

## 3. What it might cost

Reported **pay-per-second** prices (silent, 720p–1080p):

| Price level | Examples (as reported) | ~Cost per second |
|---|---|---|
| Budget | Veo 3.1 Lite, Luma Ray 720p, Runway Gen-4 Turbo | $0.05–0.08 |
| Middle | Kling 3.0 1080p, Runway Gen-4.5 | ~$0.08–0.12 |
| Premium | Veo 3.1 Standard | ~$0.40 |

| Plan | Seconds | Budget | Middle | Premium |
|---|---|---|---|---|
| Test (Shot 2) | 15 s | ~$0.75–1.20 | ~$1.20–1.80 | ~$6 |
| Small (2 + 5) | 30 s | ~$1.50–2.40 | ~$2.40–3.60 | ~$12 |
| Full (2 + 4 + 5) | 45 s | ~$2.25–3.60 | ~$3.60–5.40 | ~$18 |

### Subscriptions vs paying per second
Most beginners use a **monthly subscription** on the service's website or app
(easiest on an iPad). Reported entry plans:

| Service | Entry plan (reported) | Roughly enough for |
|---|---|---|
| Kling | ~$7–10 / month, 660 credits | ~80–110 s at 720p–1080p silent |
| Runway | $15 / month ($12 yearly), 625 credits | ~50 s of Gen-4.5 |
| Luma | $30 / month ($25 yearly) | far more than we need |

➡️ **One month of an entry plan (about $10–15) covers even the full
realistic plan, retries included.** Credits usually **don't roll over**, and
plans **auto-renew**, so set a reminder to cancel.

### Free tiers (to test first, $0)
- **Kling:** reported free daily credits, about 2 short 720p clips a day,
  **with a watermark**.
- **Runway:** a one-time batch of free credits, enough for a short test.

Watermarked clips are fine for **testing prompts**, but not for the final
film or Instagram. Also check whether the free tier allows **commercial use**.

---

## 4. The smart way to generate

1. **Image-to-video, not just text.** Give the AI a still frame from **our
   own code shot** as the starting picture. It keeps our composition
   (lighthouse on the left, horizon in the same place), so the AI shot slots
   into the edit naturally.
2. **Use the prompts** in `STORYBOARD.md` section 5.
3. **Ask for 16:9 and 1080p**, and silent if possible.
4. **Download the best take** and send it to Claude (attach it in the app,
   or upload it to `footage/`).

### What Claude does with the AI clip (free)
- Trims it to exactly 4 seconds
- Converts it to 30 frames per second
- **Color-grades** it to our cold blue look, with a warm lamp
- Adds **grain + letterbox bars** to match the other shots
- Swaps it into the rough cut

---

## 5. Before posting AI shots on Instagram

- **Change the caption:** it currently says "no AI video generator", which would
  no longer be true.
- Instagram asks creators to **label realistic AI-made video** ("AI info" label
  when posting). Use it.
- Keep a note of which service made each shot.

---

## 6. Decision checklist

- [ ] Choose: stay stylized, or go realistic
- [ ] Test Shot 2 on a free tier (with a watermark, just to judge quality)
- [ ] If good: one month of an entry plan (~$10–15), then **cancel the renewal**
- [ ] Generate Shot 2 → 5 → 4 (3 tries each)
- [ ] Send the best takes to Claude for grading and editing
- [ ] Film Shot 3 on iPad (free)
- [ ] Update the Instagram caption + AI label
