# 🎮 Memory Match Game

A fast-paced, browser-based memory matching game with beautiful animations, account management, and competitive scoring!

![Memory Match Game](https://img.shields.io/badge/Version-1.0.0-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![HTML5](https://img.shields.io/badge/HTML-5-orange)
![CSS3](https://img.shields.io/badge/CSS-3-blue)

## 🌟 Features

- 🎯 **Fast-Paced Gameplay**: Quick decision-making memory game
- 🏆 **Multiplier System**: Build streaks for up to 10× score bonuses
- 👤 **Account Management**: Create multiple player profiles
- ⏱️ **Customizable Timer**: Choose from 30 to 120-second games
- 📊 **Scoreboard**: Track top 20 high scores
- 🎨 **Beautiful UI**: Futuristic design with smooth animations
- 💾 **Local Storage**: All progress saved in browser
- 📱 **Responsive**: Works on desktop and mobile devices

## 🚀 Quick Start

1. **Download** the `memory_match` folder
2. **Open** `index.html` in your web browser
3. **Play!** No installation or setup required

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- ~50KB of disk space

## 🎮 How to Play

1. **Create Account**: Enter your name to create a player profile
2. **Choose Duration**: Select game time (30-120 seconds)
3. **Match Symbols**: Determine if each symbol matches the previous one
4. **Click Yes/No**: Make your choice quickly
5. **Build Streaks**: Answer correctly in a row to multiply your score
6. **Beat the Clock**: Score as many points as possible before time runs out!

## 🎯 Scoring System

| Streak | Multiplier | Points per Correct Answer |
|--------|-----------|---------------------------|
| 0-1    | ×1        | 100 points                |
| 2      | ×2        | 200 points                |
| 3-4    | ×3        | 300 points                |
| 5-9    | ×5        | 500 points                |
| 10+    | ×10       | 1000 points               |

**Wrong answers reset your multiplier to ×1!**

## 📁 File Structure

```
memory_match/
├── index.html           # Main HTML structure
├── styles.css           # All styling and animations
├── game.js              # Game logic and functionality
├── README.md            # Quick start guide (this file)
├── DOCUMENTATION.md     # Complete technical documentation
└── assets/              # Game symbols (SVG files)
    ├── heart.svg
    ├── star.svg
    ├── triangle.svg
    ├── circle.svg
    ├── square.svg
    └── diamond.svg
```

## 🎨 Game Symbols

The game includes 6 colorful symbols:
- ❤️ **Heart** (Pink)
- ⭐ **Star** (Yellow)
- 🔺 **Triangle** (Purple)
- 🔵 **Circle** (Blue)
- 🟩 **Square** (Green)
- 🔶 **Diamond** (Orange)

Each symbol appears at random rotations to keep the game challenging!

## 🛠️ Technical Details

- **Pure JavaScript**: No frameworks or libraries required
- **Vanilla CSS**: No CSS preprocessors needed
- **LocalStorage API**: For data persistence
- **SVG Graphics**: Scalable vector symbols
- **CSS Animations**: Smooth 60 FPS animations
- **Responsive Design**: Mobile-friendly layout

## 📖 Documentation

For complete technical documentation, customization guides, and advanced features, see [DOCUMENTATION.md](DOCUMENTATION.md)

## 🎨 Customization

### Add New Symbols
1. Create an SVG file in the `assets/` folder
2. Add the file path to the `symbols` array in `game.js`

### Change Colors
Edit color values in `styles.css` to match your preferred theme

### Adjust Difficulty
Modify the match probability in the `showNextSymbol()` function

See [DOCUMENTATION.md](DOCUMENTATION.md) for detailed customization instructions.

## 🐛 Troubleshooting

**Symbols not showing?**
- Verify all SVG files are in the `assets/` folder
- Check browser console (F12) for errors

**Scores not saving?**
- Ensure browser allows localStorage
- Check you're not in incognito/private mode

**Game running slow?**
- Close other browser tabs
- Enable hardware acceleration
- Update to latest browser version

## 🎯 Tips for High Scores

1. **Stay Focused**: Don't let the timer pressure you
2. **Build Streaks**: Accuracy beats speed when building multipliers
3. **Pattern Recognition**: Remember symbol characteristics
4. **Practice**: Play regularly to improve reaction time
5. **Longer Games**: 120-second games allow bigger scores

## 📊 Game Statistics

After each game, view your:
- Final Score
- Correct Answers
- Wrong Answers
- Accuracy Percentage

## 🏆 Leaderboard

- Top 20 scores displayed
- Shows player name, score, and date
- Gold highlight for #1 position
- Separate best scores for each account

## 🔧 Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome 90+ | ✅ |
| Firefox 88+ | ✅ |
| Safari 14+ | ✅ |
| Edge 90+ | ✅ |
| Opera 76+ | ✅ |

## 📝 Version History

### Version 1.0.0 (Current)
- Initial release
- Core gameplay mechanics
- Account management system
- Scoreboard and statistics
- Customizable timer settings
- 6 symbol types
- Multiplier system (×1 to ×10)

## 🎮 Game Modes

**Current Mode: Survival**
- Beat the clock
- Build multipliers
- Achieve high scores

**Future Modes (Planned):**
- Practice Mode (no timer)
- Challenge Mode (increasing difficulty)
- Versus Mode (local multiplayer)

## 💡 Future Features

Ideas for upcoming versions:
- Sound effects and music
- Additional symbols
- Difficulty levels
- Power-ups
- Achievements system
- Dark mode theme
- Online leaderboards

## 🤝 Contributing

Feel free to fork, modify, and enhance this game! 

**Ideas for contributions:**
- New symbol designs
- Additional game modes
- Sound effects
- Translation to other languages
- Performance optimizations

## 📜 License

This project is **free to use, modify, and distribute**. 

Attribution is appreciated but not required.

## 🎉 Credits

- **Font**: Orbitron by Google Fonts
- **Graphics**: Custom SVG symbols
- **Code**: Vanilla JavaScript/HTML/CSS

## 📞 Support

For detailed technical documentation and troubleshooting, see [DOCUMENTATION.md](DOCUMENTATION.md)

---

**Ready to test your memory?**

Open `index.html` and start playing! 🚀

**Good luck and have fun!** 🎮✨

---

Made with ❤️ for memory game enthusiasts

