# Number Blitz — Game Database Connectivity Prototype

**Course:** System Fundamentals Lab (1stBIT4120L)
**Activity:** Activity 5 — Game Database Connectivity Prototype

---

## Group Information

| Item | Answer |
| --- | --- |
| Group Number | *(fill in)* |
| Group Members | *(fill in — complete names)* |
| Prototype Direction | Guided Simple Game Prototype |
| Development Path | Path B — Simple Web Game Prototype |

---

## Short Description

Number Blitz is a 60-second arithmetic challenge. The player types a nickname,
then answers as many multiple-choice math questions as they can before the timer
runs out. Every five correct answers raises the level, which makes the questions
harder and makes each correct answer worth more points. A wrong answer costs
three seconds.

When the round ends, the game saves the result as a record and the player can
open a leaderboard that reads those records back out of storage and displays
them ranked by score.

---

## Tools and Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript (no frameworks or libraries)
- Visual Studio Code
- Google Chrome *(update if your group tested on a different browser)*
- Git and GitHub

---

## Database / Storage Option Used

**Browser localStorage**, under the collection key `player_scores`.

Records are stored as a JSON array. No server, no account, and no credentials
are involved, so nothing sensitive is committed to this repository.

### Record structure

| Field Name | Data Type | Description |
| --- | --- | --- |
| `player_id` | Text (auto-generated) | Unique identifier of the record |
| `player_name` | Text | Nickname entered by the player |
| `score` | Number | Points earned in the round |
| `level` | Number | Highest level reached |
| `remarks` | Text | Result label derived from the score |
| `created_at` | Text (ISO date-time) | When the record was saved |

`player_id` is the unique identifier. It is built from a base-36 timestamp plus
a random suffix, so two records saved in the same second cannot collide.

Example of one stored record:

```json
{
  "player_id": "PLR-m1k4z9x-a7f2q",
  "player_name": "Ivan",
  "score": 310,
  "level": 4,
  "remarks": "Very good",
  "created_at": "2026-09-17T08:41:22.518Z"
}
```

---

## How to Run the Prototype

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html` in a web browser.
   - Double-clicking the file works.
   - The Live Server extension in VS Code also works and is easier for testing.
4. Type a player name and press **Start game**.
5. Answer questions until the timer reaches zero.
6. Press **View saved records** to see the retrieved data.

No installation, build step, or internet connection is required. The only
external resource is the Google Fonts stylesheet, and the game still runs
without it.

---

## What Data Is Saved and Retrieved

**Saved.** When the 60-second timer hits zero, `endRound()` calls `DB.save()`.
One record containing the six fields above is appended to the `player_scores`
array in localStorage. The result screen confirms the save by showing the
generated `player_id`.

**Retrieved.** Pressing **View saved records** calls `renderRecords()`, which
calls `DB.getRanked(10)`. That function reads the whole `player_scores` array
back out of storage, sorts it by score (then by newest), and returns the top ten.

**Displayed.** The retrieved records are rendered as a ranked leaderboard inside
the game interface, each row showing the rank, player name, level, remarks,
date and time, and score. The same screen has a **Show stored data (raw)**
section that prints the raw JSON exactly as it sits in storage.

---

## Where the Save and Retrieve Functions Are

All storage code lives in the `DB` object at the top of `script.js`.

| Function | Line region | What it does |
| --- | --- | --- |
| `DB.newId()` | Section 1 | Generates the unique `player_id` |
| `DB.save()` | Section 1 | Writes one new record to `player_scores` |
| `DB.getAll()` | Section 1 | Reads every record out of storage |
| `DB.getRanked()` | Section 1 | Reads and sorts records for the leaderboard |
| `DB.clear()` | Section 1 | Deletes the whole collection |
| `endRound()` | Section 3 | Calls `DB.save()` when the timer ends |
| `renderRecords()` | Section 3 | Calls `DB.getRanked()` and displays the results |

`script.js` is divided into four commented sections: **1. DB**, **2. Game**,
**3. UI**, **4. Wiring**.

---

## Files in This Repository

```
index.html    Game interface and the four screens
style.css     All styling
script.js     Storage layer, game logic, UI rendering
README.md     This file
```

---

## Known Limitations

- Data is stored per browser, per device. Records saved in Chrome will not
  appear in Firefox, and clearing browser data deletes them.
- There is no shared or online leaderboard. Players cannot see each other's
  scores across devices.
- Records cannot be edited or deleted individually, only all at once.
- The leaderboard displays the top ten records only, although all records stay
  in storage.
- Questions use addition, subtraction, and multiplication only.
- If a browser blocks localStorage (private browsing in some browsers), the game
  still plays but shows a message that the record could not be saved.

---

## References

*(List any tutorials or documentation your group used. For example:)*

- MDN Web Docs — Window.localStorage
- MDN Web Docs — JSON.parse() and JSON.stringify()
