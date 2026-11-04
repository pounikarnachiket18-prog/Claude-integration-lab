# Daily Brief: an iPad / iPhone news app

PIB, RBI, Indian current affairs and world news in one app, built with SwiftUI.

## What's inside

| Tab | Sources |
|---|---|
| **PIB** | PIB press releases (official RSS) + "PIB in the news" |
| **RBI** | RBI press releases, notifications and speeches (official RSS) + "RBI in the news" |
| **Current Affairs** | Top stories India, The Hindu (National), Business & Economy, Govt schemes & policy |
| **World** | World headlines, BBC World, Al Jazeera, Science & Tech |
| **Saved** | Stories you saved (kept on your device) |

Each tab:
- loads all its sources at once, removes duplicate headlines, and shows the newest first
- **pull down** to refresh
- **search** box at the top
- **All / Today** filter
- **tap** a story to read it inside the app (Safari view, with Reader mode)
- **swipe left** to save; **long-press** to share
- says which source failed if one doesn't load

## Run it on your iPad (free, no Mac needed)

1. Install **Swift Playgrounds** from the App Store (free, made by Apple).
2. Open it and tap **+ App** (or **App** under "Get Started") to create a new app.
3. Open the file **ContentView.swift** in the left sidebar.
4. **Select all** the code in it and delete it.
5. Copy **all** of `ContentView.swift` from this folder and paste it in.
   - On GitHub: open the file → tap **Raw** → select all → copy.
6. Tap **Run (▶)** at the top. The app opens on the right; tap the full-screen
   button to use it full screen.

Leave the other file (`MyApp.swift`) as it is. It already opens `ContentView`.

## Change or add news sources

At the top of `ContentView.swift`, each tab has a list of `FeedSource(name:url:)` lines.
Add a line with any RSS feed address, or use `googleNews("your topic")` for any topic,
for example:

```swift
FeedSource(name: "UPSC & Exams", url: googleNews("UPSC OR SSC OR \"RBI Grade B\" when:2d")),
```

## Good to know

- **Internet needed:** the app downloads the latest news each time you refresh.
- **Official feed addresses can change.** If PIB or RBI shows "Couldn't load", the
  "in the news" source in the same tab still works. Tell Claude and the address can be updated.
- **Home Screen:** Swift Playgrounds runs the app inside Playgrounds for free. Putting it
  on the Home Screen or the App Store needs an Apple Developer account ($99 a year).
- **This code hasn't been compiled yet.** It was written without access to Apple's tools.
  If Swift Playgrounds shows a red error, send a screenshot to Claude and it will fix it.
