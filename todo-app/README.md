# ⚡ Momentum

A tiny, ADHD-friendly todo app for personal and professional tasks. No build
step, no dependencies, no account — open `index.html` in a browser and go.
Everything is saved in your browser's localStorage.

## Run it

```bash
# option 1: just open the file
open todo-app/index.html        # macOS
xdg-open todo-app/index.html    # Linux

# option 2: serve it (nicer for bookmarking)
npx serve todo-app
```

## Why it's ADHD-friendly

| Feature | Why it helps |
|---|---|
| **One-box quick capture** | Get thoughts out of your head instantly, zero forms. Press `/` anywhere to jump to the input. |
| **Focus mode (max 3 tasks)** | You never stare at a wall of undone things. The rest is safe in "Everything". |
| **🎲 Pick for me** | Kills decision paralysis — it favors tiny quick wins, then important stuff. |
| **Confetti + XP + levels** | A real dopamine hit for every completed task. Important tasks give bonus XP. |
| **🔥 Daily streak** | Finish at least one thing a day to keep the flame alive. |
| **Personal / Work spaces** | Contexts stay separate, so work doesn't leak into your evening. |
| **`~2m` tiny tasks** | Mark two-minute tasks; they get surfaced first as easy momentum-starters. |

## Capture shorthand

Type naturally and sprinkle in shorthand — it's parsed out of the title:

| You type | It means |
|---|---|
| `email Sam #work` | files the task under **Work** |
| `water plants #personal` | files it under **Personal** |
| `call dentist !` | marks it **important** (bonus XP, sorted first) |
| `take out trash ~2m` | marks it a **tiny task** (quick-win priority) |

If you're on the Personal or Work tab when you add a task, it's filed there
automatically — no tag needed.

## Data

State lives in `localStorage` under the key `momentum.v1`. Clearing site data
resets tasks, XP, level, and streak. There is no server and nothing leaves
your machine.
