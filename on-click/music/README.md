# Background Music

## Instructions

To add background music to your game:

1. **Add your music file** to this folder
2. **Name it** `background.mp3` (or `background.ogg`)
3. The music will automatically play when the game starts!

## Supported Formats

- **MP3** (recommended) - `background.mp3`
- **OGG** - `background.ogg`

## Recommendations

- Use **loopable** music (seamless loop for continuous play)
- Keep file size under **5MB** for faster loading
- Volume is set to **30%** by default (can be changed in `game.js`)

## Where to Find Music

### Free Music Resources:
- **YouTube Audio Library** (free, no attribution required)
- **Free Music Archive** (fma.org)
- **Incompetech** (incompetech.com)
- **Purple Planet Music** (purple-planet.com)
- **Bensound** (bensound.com)

### Tips:
- Look for "upbeat game music" or "puzzle game background music"
- Ensure music is royalty-free or properly licensed
- Test volume levels - background music shouldn't be too loud!

## Current Setup

The game looks for:
- `music/background.mp3` (primary)
- `music/background.ogg` (fallback)

If no music file is found, the game will run silently (no errors).

## Changing Volume

To adjust music volume, edit `game.js` and find:

```javascript
function initializeMusic() {
    GameState.backgroundMusic = document.getElementById('background-music');
    if (GameState.backgroundMusic) {
        GameState.backgroundMusic.volume = 0.3; // Change this (0.0 to 1.0)
    }
}
```

- `0.0` = Muted
- `0.3` = 30% volume (current default)
- `0.5` = 50% volume
- `1.0` = 100% volume (maximum)

---

**Enjoy your game with music!** 🎵🎮

