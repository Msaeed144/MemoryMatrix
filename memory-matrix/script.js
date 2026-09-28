// Game State
let gameState = {
    level: 1,
    score: 0,
    bestScore: 0,
    currentRound: 1,
    totalRounds: Infinity, // Infinite levels
    gridSize: 3,
    gridWidth: 3,
    gridHeight: 3,
    pattern: [],
    playerPattern: [],
    patternCells: 4,
    showTime: 600, // Time each cell is shown (faster)
    delayTime: 100, // Delay between cells (faster)
    isPlaying: false,
    isPaused: false,
    canClick: false,
    // Per-round and total mistake tracking
    roundMistakes: 0,      // wrong clicks in the current round (max 3)
    mistakeRounds: 0,      // number of rounds where 3 mistakes were used (max 3 for whole game)
    scoreHistory: [],
    difficultyStage: 1, // Track difficulty stages
    baseShowTime: 800,
    baseDelayTime: 200,
    basePatternCells: 4,
    consecutiveWins: 0,
    difficultyMultiplier: 5.0,
    gameMode: 'sequential', // 'sequential' or 'flash'
    expansionCount: 0, // Track number of expansions for alternating
    timeMode: false, // Whether time limit is enabled
    timeLimit: 0, // Time limit in seconds (0 = unlimited)
    timeRemaining: 0, // Time remaining in current game (global mode)
    timerInterval: null, // Timer interval reference (global mode)
    // Per-round timer
    roundTimeRemaining: 0,
    roundTimerInterval: null,
    playerMode: 'single' // 'single' or 'multi'
};

// Multiplayer State
let multiplayerState = {
    currentPlayer: 1, // 1 or 2
    player1: {
        level: 1,
        score: 0,
        currentRound: 1,
        gridSize: 3,
        gridWidth: 3,
        gridHeight: 3,
        pattern: [],
        playerPattern: [],
        patternCells: 4,
        showTime: 600,
        delayTime: 100,
        canClick: false,
        difficultyStage: 1,
        baseShowTime: 600,
        baseDelayTime: 100,
        basePatternCells: 5,
        consecutiveWins: 0,
        difficultyMultiplier: 1.0,
        expansionCount: 0,
        timeRemaining: 0,
        timerInterval: null,
        isActive: true
    },
    player2: {
        level: 1,
        score: 0,
        currentRound: 1,
        gridSize: 3,
        gridWidth: 3,
        gridHeight: 3,
        pattern: [],
        playerPattern: [],
        patternCells: 4,
        showTime: 600,
        delayTime: 100,
        canClick: false,
        difficultyStage: 1,
        baseShowTime: 600,
        baseDelayTime: 100,
        basePatternCells: 5,
        consecutiveWins: 0,
        difficultyMultiplier: 1.0,
        expansionCount: 0,
        timeRemaining: 0,
        timerInterval: null,
        isActive: true
    },
    isPlaying: false,
    isPaused: false
};

// Settings
let settings = {
    sfx: true,
    music: true,
    vibration: true
};

// Game Statistics & Logging
let gameStats = {
    totalGamesPlayed: 0,
    totalGamesCompleted: 0,
    gamesPerDifficulty: {
        easy: 0,
        mid: 0,
        hard: 0,
        impossible: 0
    },
    gamesPerMode: {
        single: 0,
        multi: 0
    },
    gamesPerGameMode: {
        sequential: 0,
        flash: 0
    },
    highestLevel: 0,
    totalScore: 0,
    lastPlayed: null,
    playHistory: [] // Detailed log of last 50 games
};

// Difficulty Presets
const difficultyPresets = {
    easy: {
        name: 'Easy',
        gridWidth: 3,
        gridHeight: 3,
        patternCells: 3,
        baseShowTime: 1000,
        baseDelayTime: 200,
        basePatternCells: 3,
        minShowTime: 150,
        minDelayTime: 60
    },
    mid: {
        name: 'Mid',
        gridWidth: 3,
        gridHeight: 3,
        patternCells: 4,
        baseShowTime: 800,
        baseDelayTime: 100,
        basePatternCells: 4,
        minShowTime: 120,
        minDelayTime: 50
    },
    hard: {
        name: 'Hard',
        gridWidth: 4,
        gridHeight: 4,
        patternCells: 6,
        baseShowTime: 700,
        baseDelayTime: 80,
        basePatternCells: 6,
        minShowTime: 100,
        minDelayTime: 40
    },
    impossible: {
        name: 'Impossible',
        gridWidth: 5,
        gridHeight: 5,
        patternCells: 10,
        baseShowTime: 600,
        baseDelayTime: 60,
        basePatternCells: 10,
        minShowTime: 80,
        minDelayTime: 30
    }
};

let currentDifficulty = 'mid';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadBestScore();
    loadScoreHistory();
    updateBestScoreDisplay();
    loadGameMode();
    loadTimeMode();
    loadPlayerMode();
    loadDifficulty();
    loadGameStats();
});

// Navigation Functions
function beginGameSession() {
    document.getElementById('mainMenu').classList.remove('active');
    
    // Log game start
    logGameStart();
    
    if (gameState.playerMode === 'multi') {
        // Start multiplayer game
        document.getElementById('multiplayerScreen').classList.add('active');
        if (window.HamkarMotion) HamkarMotion.enterScreen('multiplayerScreen');
        startMultiplayerGame();
    } else {
        // Start single player game
        document.getElementById('gameScreen').classList.add('active');
        if (window.HamkarMotion) HamkarMotion.enterScreen('gameScreen');
        resetGame();
        initializeGrid();
        
        // Start timer if time mode is enabled
        if (gameState.timeMode) {
            startTimer();
        }
        
        startRound();
    }
}

function startGame() {
    if (!window.HamkarAuth || !window.HamkarAPI) {
        alert('Auth is not available. Please open the site through the game server URL.');
        return;
    }
    window.HamkarAuth.requireAuth(() => {
        loadBestScore()
            .then(() => {
                updateBestScoreDisplay();
                beginGameSession();
            })
            .catch((err) => {
                console.error(err);
                beginGameSession();
            });
    });
}

// Player Mode Functions
function selectPlayerMode(mode) {
    gameState.playerMode = mode;
    
    // Update UI
    document.querySelectorAll('.player-mode-btn').forEach(btn => btn.classList.remove('active'));
    if (mode === 'single') {
        document.getElementById('singlePlayerBtn').classList.add('active');
    } else {
        document.getElementById('multiPlayerBtn').classList.add('active');
    }
    
    // Save preference
    localStorage.setItem('memoryMatrixPlayerMode', mode);
}

function loadPlayerMode() {
    const savedMode = localStorage.getItem('memoryMatrixPlayerMode') || 'single';
    gameState.playerMode = savedMode;
    
    // Update UI
    document.querySelectorAll('.player-mode-btn').forEach(btn => btn.classList.remove('active'));
    if (savedMode === 'single') {
        document.getElementById('singlePlayerBtn').classList.add('active');
    } else {
        document.getElementById('multiPlayerBtn').classList.add('active');
    }
}

// Difficulty Functions
function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    // Update UI
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(difficulty + 'Btn').classList.add('active');
    
    // Save preference
    localStorage.setItem('memoryMatrixDifficulty', difficulty);
    
    // Show message
    const preset = difficultyPresets[difficulty];
    showMessage(`Difficulty: ${preset.name} - Start ${preset.gridWidth}x${preset.gridHeight}`, 2000);
}

function loadDifficulty() {
    const savedDifficulty = localStorage.getItem('memoryMatrixDifficulty') || 'mid';
    currentDifficulty = savedDifficulty;
    
    // Update UI
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
    const diffBtn = document.getElementById(savedDifficulty + 'Btn');
    if (diffBtn) diffBtn.classList.add('active');
}

function applyDifficultyToGameState() {
    const preset = difficultyPresets[currentDifficulty];
    
    gameState.gridWidth = preset.gridWidth;
    gameState.gridHeight = preset.gridHeight;
    gameState.gridSize = Math.max(preset.gridWidth, preset.gridHeight);
    gameState.patternCells = preset.patternCells;
    gameState.baseShowTime = preset.baseShowTime;
    gameState.baseDelayTime = preset.baseDelayTime;
    gameState.basePatternCells = preset.basePatternCells;
    gameState.showTime = preset.baseShowTime;
    gameState.delayTime = preset.baseDelayTime;
}

function applyDifficultyToPlayer(player) {
    const preset = difficultyPresets[currentDifficulty];
    
    player.gridWidth = preset.gridWidth;
    player.gridHeight = preset.gridHeight;
    player.gridSize = Math.max(preset.gridWidth, preset.gridHeight);
    player.patternCells = preset.patternCells;
    player.baseShowTime = preset.baseShowTime;
    player.baseDelayTime = preset.baseDelayTime;
    player.basePatternCells = preset.basePatternCells;
    player.showTime = preset.baseShowTime;
    player.delayTime = preset.baseDelayTime;
}

// Game Mode Functions
function selectGameMode(mode) {
    gameState.gameMode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(mode + 'Mode').classList.add('active');
    
    // Save preference
    localStorage.setItem('memoryMatrixGameMode', mode);
    
    // Show mode-specific tips
    if (mode === 'flash') {
        showMessage('Flash Mode: All patterns shown at once!', 3000);
    } else {
        showMessage('Sequential Mode: Patterns shown one by one!', 3000);
    }
}

function loadGameMode() {
    const savedMode = localStorage.getItem('memoryMatrixGameMode') || 'sequential';
    gameState.gameMode = savedMode;
    
    // Update UI
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => btn.classList.remove('active'));
    const modeBtn = document.getElementById(savedMode + 'Mode');
    if (modeBtn) modeBtn.classList.add('active');
}

// Time mode functions
function toggleTimeMode() {
    const timeSettings = document.getElementById('timeSettings');
    if (timeSettings.style.display === 'none') {
        timeSettings.style.display = 'flex';
    } else {
        timeSettings.style.display = 'none';
    }
}

function setTimeLimit(seconds) {
    gameState.timeLimit = seconds;
    gameState.timeMode = seconds > 0;
    
    // Update UI
    const timeModeBtn = document.querySelector('.time-mode-btn');
    const timeModeText = document.getElementById('timeModeText');
    
    if (seconds === 0) {
        timeModeText.textContent = 'Unlimited';
        timeModeBtn.classList.remove('active');
    } else if (seconds === 30) {
        timeModeText.textContent = '30s';
        timeModeBtn.classList.add('active');
    } else if (seconds === 60) {
        timeModeText.textContent = '1min';
        timeModeBtn.classList.add('active');
    } else if (seconds === 120) {
        timeModeText.textContent = '2min';
        timeModeBtn.classList.add('active');
    }
    
    // Hide settings
    document.getElementById('timeSettings').style.display = 'none';
    
    // Save preference
    localStorage.setItem('memoryMatrixTimeMode', gameState.timeMode);
    localStorage.setItem('memoryMatrixTimeLimit', gameState.timeLimit);
}

function loadTimeMode() {
    const savedTimeMode = localStorage.getItem('memoryMatrixTimeMode') === 'true';
    const savedTimeLimit = parseInt(localStorage.getItem('memoryMatrixTimeLimit')) || 0;
    
    gameState.timeMode = savedTimeMode;
    gameState.timeLimit = savedTimeLimit;
    
    // Update UI
    if (savedTimeLimit > 0) {
        setTimeLimit(savedTimeLimit);
    }
}

function startTimer() {
    if (!gameState.timeMode) return;
    
    gameState.timeRemaining = gameState.timeLimit;
    updateTimerDisplay();
    
    // Show timer
    document.getElementById('timerDisplay').style.display = 'block';
    
    // Clear existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // Start countdown
    gameState.timerInterval = setInterval(() => {
        if (gameState.isPaused) return;
        
        gameState.timeRemaining--;
        updateTimerDisplay();
        
        if (gameState.timeRemaining <= 0) {
            clearInterval(gameState.timerInterval);
            timeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function updateTimerDisplay() {
    const display = document.getElementById('timeRemainingDisplay');
    if (!display) return;
    
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color based on time remaining
    if (gameState.timeRemaining <= 10) {
        display.style.color = '#D00000';
    } else if (gameState.timeRemaining <= 30) {
        display.style.color = '#F48C06';
    } else {
        display.style.color = '#FFBA08';
    }
}

function timeUp() {
    showMessage('Time\'s up! Game Over!', 3000);
    playSound('wrong');
    endGame();
}

// ===== PER-ROUND TIMER (single player) =====
function getRoundTimeLimitMs() {
    // Base time per pattern cell (ms)
    const basePerCell = 1500;
    const minTime = 4000;   // at least 4s
    const maxTime = 20000;  // at most 20s
    
    const cellsCount = gameState.pattern.length || gameState.patternCells;
    let time = cellsCount * basePerCell;
    
    return Math.max(minTime, Math.min(maxTime, time));
}

function startRoundTimer() {
    // Clear any existing round timer
    stopRoundTimer();
    
    gameState.roundTimeRemaining = Math.floor(getRoundTimeLimitMs() / 1000); // store in seconds
    
    // Show round timer in header
    const roundTimerStat = document.getElementById('roundTimerStat');
    const roundTimeDisplay = document.getElementById('roundTimeDisplay');
    if (roundTimerStat && roundTimeDisplay) {
        roundTimerStat.style.display = 'block';
        roundTimeDisplay.textContent = `${gameState.roundTimeRemaining}s`;
    }

    updateRoundTimerMessage();
    
    gameState.roundTimerInterval = setInterval(() => {
        if (!gameState.isPlaying || gameState.isPaused || !gameState.canClick) return;
        
        gameState.roundTimeRemaining -= 1;
        updateRoundTimerMessage();
        
        if (gameState.roundTimeRemaining <= 0) {
            stopRoundTimer();
            handleRoundTimeUp();
        }
    }, 1000);
}

function stopRoundTimer() {
    if (gameState.roundTimerInterval) {
        clearInterval(gameState.roundTimerInterval);
        gameState.roundTimerInterval = null;
    }
    
    // Hide round timer in header
    const roundTimerStat = document.getElementById('roundTimerStat');
    if (roundTimerStat) {
        roundTimerStat.style.display = 'none';
    }
}

function updateRoundTimerMessage() {
    // Append remaining time info to existing message area and header
    const messageDisplay = document.getElementById('messageDisplay');
    const roundTimeDisplay = document.getElementById('roundTimeDisplay');
    if (!messageDisplay) return;
    
    const baseText = messageDisplay.textContent.split(' | ')[0];
    if (gameState.roundTimeRemaining > 0 && gameState.canClick) {
        messageDisplay.textContent = `${baseText} | Time left: ${gameState.roundTimeRemaining}s`;
        if (roundTimeDisplay) {
            roundTimeDisplay.textContent = `${gameState.roundTimeRemaining}s`;
        }
    } else if (baseText) {
        messageDisplay.textContent = baseText;
    }
}

function handleRoundTimeUp() {
    if (!gameState.isPlaying || !gameState.canClick) return;
    
    gameState.canClick = false;
    
    const cells = document.querySelectorAll('.grid-cell');
    
    // Show full correct pattern
    gameState.pattern.forEach(idx => {
        cells[idx].classList.add('pattern');
    });
    
    gameState.mistakeRounds += 1;
    
    if (gameState.mistakeRounds < 3) {
        showMessage(`Time is up this round (${gameState.mistakeRounds}/3). Showing correct pattern...`);
        
        setTimeout(() => {
            cells.forEach(cellEl => {
                cellEl.classList.remove('selected', 'wrong', 'pattern');
            });
            
            // Go to next round (reset win streak)
            gameState.currentRound++;
            gameState.consecutiveWins = 0;
            levelUp();
            setTimeout(() => startRound(), 800);
        }, 1200);
    } else {
        // Third failed round in the whole game -> Game Over
        showMessage('You reached 3 failed rounds (time). Game Over!');
        
        setTimeout(() => {
            cells.forEach(cellEl => {
                cellEl.classList.remove('selected', 'wrong', 'pattern');
            });
            endGame();
        }, 1200);
    }
}

// Navigation Functions (startGame / beginGameSession defined near init)

function pauseGame() {
    if (gameState.playerMode === 'multi') {
        if (!multiplayerState.isPlaying) return;
        multiplayerState.isPaused = true;
    } else {
        if (!gameState.isPlaying) return;
        gameState.isPaused = true;
    }
    document.getElementById('pauseMenu').classList.add('active');
}

function resumeGame() {
    if (gameState.playerMode === 'multi') {
        multiplayerState.isPaused = false;
    } else {
        gameState.isPaused = false;
    }
    document.getElementById('pauseMenu').classList.remove('active');
}

function backToMenu() {
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('multiplayerScreen').classList.remove('active');
    document.getElementById('pauseMenu').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('mainMenu').classList.add('active');
    if (window.HamkarMotion) HamkarMotion.enterMenu();
    
    // Stop any timers
    stopTimer();
    stopMultiplayerTimers();
    
    resetGame();
}

function showSettings() {
    document.getElementById('settingsMenu').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsMenu').classList.remove('active');
    saveSettings();
}

function closeScoreHistory() {
    document.getElementById('scoreHistory').classList.remove('active');
}

function showGameStatsModal() {
    updateGameStatsDisplay();
    document.getElementById('gameStatsModal').classList.add('active');
}

function closeGameStats() {
    document.getElementById('gameStatsModal').classList.remove('active');
}

function updateGameStatsDisplay() {
    const report = getGameStatsReport();
    const content = document.getElementById('gameStatsContent');
    
    content.innerHTML = `
        <div class="stats-section">
            <h3>📈 Summary</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Games</div>
                    <div class="stat-value">${report.summary.totalGamesPlayed}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Completed</div>
                    <div class="stat-value">${report.summary.totalGamesCompleted}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Completion Rate</div>
                    <div class="stat-value">${report.summary.completionRate}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Highest Level</div>
                    <div class="stat-value">${report.summary.highestLevel}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Score</div>
                    <div class="stat-value">${report.summary.totalScore.toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Average Score</div>
                    <div class="stat-value">${report.summary.averageScore.toLocaleString()}</div>
                </div>
            </div>
        </div>
        
        <div class="stats-section">
            <h3>🎮 By Difficulty</h3>
            <div class="stats-list">
                <div class="stats-item"><span>Easy:</span> <strong>${report.byDifficulty.easy}</strong></div>
                <div class="stats-item"><span>Mid:</span> <strong>${report.byDifficulty.mid}</strong></div>
                <div class="stats-item"><span>Hard:</span> <strong>${report.byDifficulty.hard}</strong></div>
                <div class="stats-item"><span>Impossible:</span> <strong>${report.byDifficulty.impossible}</strong></div>
            </div>
        </div>
        
        <div class="stats-section">
            <h3>👥 By Mode</h3>
            <div class="stats-list">
                <div class="stats-item"><span>Single Player:</span> <strong>${report.byMode.single}</strong></div>
                <div class="stats-item"><span>Multiplayer:</span> <strong>${report.byMode.multi}</strong></div>
                <div class="stats-item"><span>Sequential:</span> <strong>${report.byGameMode.sequential}</strong></div>
                <div class="stats-item"><span>Flash:</span> <strong>${report.byGameMode.flash}</strong></div>
            </div>
        </div>
        
        <div class="stats-section">
            <h3>📅 Recent Games (Last 5)</h3>
            <div class="recent-games">
                ${report.recentGames.slice(0, 5).map(game => `
                    <div class="recent-game-item">
                        <div class="game-info">
                            <span class="game-date">${game.date}</span>
                            <span class="game-details">${game.playerMode} • ${game.difficulty} • ${game.gameMode}</span>
                        </div>
                        <div class="game-stats">
                            <span>Level: ${game.level}</span>
                            <span>Score: ${game.score}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="stats-footer">
            <small>Last Played: ${report.summary.lastPlayed}</small>
        </div>
    `;
}

// Game Logic
function resetGame() {
    const currentMode = gameState.gameMode; // Preserve game mode
    const currentTimeMode = gameState.timeMode; // Preserve time mode
    const currentTimeLimit = gameState.timeLimit; // Preserve time limit
    
    // Stop any existing timer
    stopTimer();
    
    // Get difficulty preset
    const preset = difficultyPresets[currentDifficulty];
    
    gameState = {
        ...gameState,
        level: 1,
        score: 0,
        currentRound: 1,
        gridSize: Math.max(preset.gridWidth, preset.gridHeight),
        gridWidth: preset.gridWidth,
        gridHeight: preset.gridHeight,
        pattern: [],
        playerPattern: [],
        patternCells: preset.patternCells,
        showTime: preset.baseShowTime,
        delayTime: preset.baseDelayTime,
        isPlaying: true,
        isPaused: false,
        canClick: false,
        difficultyStage: 1,
        baseShowTime: preset.baseShowTime,
        baseDelayTime: preset.baseDelayTime,
        basePatternCells: preset.basePatternCells,
        consecutiveWins: 0,
        difficultyMultiplier: 1.0,
        gameMode: currentMode, // Keep the selected mode
        expansionCount: 0,
        roundMistakes: 0,
        mistakeRounds: 0,
        timeMode: currentTimeMode,
        timeLimit: currentTimeLimit,
        timeRemaining: currentTimeLimit,
        timerInterval: null,
        roundTimeRemaining: 0,
        roundTimerInterval: null
    };
    
    // Hide timer if not in time mode
    if (!gameState.timeMode) {
        document.getElementById('timerDisplay').style.display = 'none';
    }
    
    updateDisplay();
}

function initializeGrid() {
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gameState.gridWidth}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${gameState.gridHeight}, 1fr)`;
    
    const totalCells = gameState.gridWidth * gameState.gridHeight;
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        cell.tabIndex = -1; // Prevent keyboard focus
        cell.addEventListener('click', () => handleCellClick(i));
        grid.appendChild(cell);
    }
    
    // Update gridSize for compatibility
    gameState.gridSize = Math.max(gameState.gridWidth, gameState.gridHeight);
    
    // Adjust cell size after creating grid
    adjustCellSize();
}

function startRound() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    gameState.canClick = false;
    gameState.playerPattern = [];
    gameState.roundMistakes = 0; // reset per-round mistakes
    gameState.roundTimeRemaining = 0; // will be set when pattern is shown
    updateDisplay();
    showMessage('Watch the pattern!');
    
    // Generate pattern
    generatePattern();
    
    // Show pattern after delay
    setTimeout(() => {
        showPattern();
    }, 1000);
}

function generatePattern() {
    gameState.pattern = [];
    const totalCells = gameState.gridWidth * gameState.gridHeight;
    const availableCells = Array.from({length: totalCells}, (_, i) => i);
    
    // Shuffle and pick required number of cells
    for (let i = 0; i < gameState.patternCells; i++) {
        const randomIndex = Math.floor(Math.random() * availableCells.length);
        gameState.pattern.push(availableCells[randomIndex]);
        availableCells.splice(randomIndex, 1);
    }
}

function showPattern() {
    const cells = document.querySelectorAll('.grid-cell');
    
    // Show all pattern cells at once, keep for 3 seconds, then hide
    gameState.pattern.forEach(cellIndex => {
        cells[cellIndex].classList.add('pattern');
    });
    playSound('click');
    
    setTimeout(() => {
        // Hide all patterns after 3 seconds
        gameState.pattern.forEach(cellIndex => {
            cells[cellIndex].classList.remove('pattern');
        });
        
        // Enable player input shortly after hiding
        setTimeout(() => {
            gameState.canClick = true;
            // Start per-round timer based on pattern size
            startRoundTimer();
            showMessage('Your turn!');
        }, 200);
    }, 3000);
}

function showPatternFlash(cells) {
    // Show all pattern cells at once
    gameState.pattern.forEach(cellIndex => {
        cells[cellIndex].classList.add('pattern');
    });
    playSound('click');
    
    // Keep them visible for the show time (adjusted for difficulty)
    const flashDuration = Math.max(gameState.showTime * 2, 500); // Minimum 500ms
    
    setTimeout(() => {
        // Hide all patterns
        gameState.pattern.forEach(cellIndex => {
            cells[cellIndex].classList.remove('pattern');
        });
        
        // Enable player input after a brief delay
        setTimeout(() => {
            gameState.canClick = true;
            showMessage('Your turn!');
        }, 300);
    }, flashDuration);
}

function showPatternSequential(cells) {
    let index = 0;
    
    const showNextCell = () => {
        if (index < gameState.pattern.length) {
            const cellIndex = gameState.pattern[index];
            cells[cellIndex].classList.add('pattern');
            playSound('click');
            
            setTimeout(() => {
                cells[cellIndex].classList.remove('pattern');
                index++;
                setTimeout(showNextCell, gameState.delayTime);
            }, gameState.showTime);
        } else {
            // Pattern shown, enable player input
            setTimeout(() => {
                gameState.canClick = true;
                showMessage('Your turn!');
            }, 500);
        }
    };
    
    showNextCell();
}

function handleCellClick(index) {
    if (!gameState.canClick || gameState.isPaused) return;
    
    const cell = document.querySelector(`[data-index="${index}"]`);
    
    // If already marked as wrong, ignore further clicks
    if (cell.classList.contains('wrong')) {
        return;
    }
    
    // Toggle selection for correct cells (part of the pattern)
    if (gameState.playerPattern.includes(index)) {
        // Unselect the cell
        const indexPosition = gameState.playerPattern.indexOf(index);
        gameState.playerPattern.splice(indexPosition, 1);
        cell.classList.remove('selected');
        playSound('click');
        
        // Vibrate if enabled
        if (settings.vibration && navigator.vibrate) {
            navigator.vibrate(30); // Shorter vibration for unselect
        }
        return;
        return;
    }
    
    // If this cell is part of the pattern → mark as correct selection
    if (gameState.pattern.includes(index)) {
        gameState.playerPattern.push(index);
        cell.classList.add('selected');
        playSound('click');
        
        // Vibrate if enabled (unselect)
        if (settings.vibration && navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // When all correct cells are selected, check the pattern
        if (gameState.playerPattern.length === gameState.pattern.length) {
            gameState.canClick = false;
            setTimeout(() => checkPattern(), 500);
        }
    } else {
        // Wrong cell: show immediately and count mistake
        cell.classList.add('wrong');
        playSound('wrong');
        
        if (settings.vibration && navigator.vibrate) {
            navigator.vibrate(70);
        }
        
        gameState.roundMistakes += 1;
        
        if (gameState.roundMistakes < 3) {
            // Still have mistakes left in this round
            showMessage(`Wrong cell! Mistakes this round: ${gameState.roundMistakes}/3`);
        } else {
            // Reached 3 mistakes in this round
            gameState.canClick = false;
            // Stop round timer (round failed)
            stopRoundTimer();
            
            const cells = document.querySelectorAll('.grid-cell');
            
            // Show full correct pattern
            gameState.pattern.forEach(idx => {
                cells[idx].classList.add('pattern');
            });
            
            gameState.mistakeRounds += 1;
            
            if (gameState.mistakeRounds <2) {
                showMessage(`You reached 2 mistakes this round (${gameState.mistakeRounds}/2). Showing correct pattern...`);
                
                setTimeout(() => {
                    // Clear all highlights
                    cells.forEach(cellEl => {
                        cellEl.classList.remove('selected', 'wrong', 'pattern');
                    });
                    
                    // Go to next round (but reset win streak)
                    gameState.currentRound++;
                    gameState.consecutiveWins = 0;
                    levelUp();
                    setTimeout(() => startRound(), 800);
                }, 1200);
            } else {
                // Third failed round in the whole game -> Game Over
                showMessage('You reached 3 failed rounds. Game Over!');
                
                setTimeout(() => {
                    const cellsAll = document.querySelectorAll('.grid-cell');
                    cellsAll.forEach(cellEl => {
                        cellEl.classList.remove('selected', 'wrong', 'pattern');
                    });
                    endGame();
                }, 1200);
            }
        }
    }
}

function checkPattern() {
    const cells = document.querySelectorAll('.grid-cell');
    let correctCount = 0;
    
    // Stop round timer (round finished successfully)
    stopRoundTimer();
    
    // Clear selection classes
    cells.forEach(cell => {
        cell.classList.remove('selected', 'pattern');
    });
    
    // Check each player selection
    gameState.playerPattern.forEach(index => {
        if (gameState.pattern.includes(index)) {
            cells[index].classList.add('correct');
            correctCount++;
        } else {
            cells[index].classList.add('wrong');
        }
    });
    
    // Show missed cells
    gameState.pattern.forEach(index => {
        if (!gameState.playerPattern.includes(index)) {
            cells[index].classList.add('pattern');
        }
    });
    
    // Calculate score only based on number of correct cells
    if (correctCount > 0) {
        let baseScore = correctCount * 10;
        let levelMultiplier = gameState.level;
        let speedBonus = Math.floor((1000 - gameState.showTime) / 100); // Bonus for faster speeds
        let sizeBonus = (gameState.gridSize - 3) * 5; // Bonus for larger grids
        
        const roundScore = baseScore * levelMultiplier + (speedBonus * 10) + (sizeBonus * 10);
        gameState.score += roundScore;
        showMessage(`Round finished! Score added`);
        playSound('correct');
    }
    
    updateDisplay();
    
    // Clear visual feedback and continue
    setTimeout(() => {
        cells.forEach(cell => {
            cell.classList.remove('correct', 'wrong', 'pattern');
        });
        
        // At this point all pattern cells are found, so go to next round
        gameState.currentRound++;
        gameState.consecutiveWins++;
        levelUp();
        setTimeout(() => startRound(), 1000);
    }, 1000);
}

function levelUp() {
    gameState.level++;
    
    // Advanced difficulty progression system
    updateDifficulty();
    
    // Create detailed level up message
    let messages = [`Level ${gameState.level}!`];
    
    // Add specific difficulty changes to message
    if (gameState.showTime < 500) {
        messages.push(`Speed: ${getSpeedText()}`);
    }
    
    if (gameState.level > 1 && gameState.gridSize > 3) {
        messages.push(`Grid: ${gameState.gridSize}x${gameState.gridSize}`);
    }
    
    if (gameState.patternCells > 5) {
        messages.push(`Pattern: ${gameState.patternCells} cells`);
    }
    
    // Show combined message
    showMessage(messages.join(' • '));
    
    // Special effects for milestone levels
    if (gameState.level % 25 === 0) {
        showMilestone(`🎉 LEVEL ${gameState.level} MILESTONE! 🎉`);
        celebrateAchievement();
    }
}

function getSpeedText() {
    if (gameState.showTime <= 100) return 'GODLIKE';
    if (gameState.showTime <= 200) return 'Insane';
    if (gameState.showTime <= 300) return 'Extreme';
    if (gameState.showTime <= 500) return 'Very Fast';
    if (gameState.showTime <= 800) return 'Fast';
    return 'Normal';
}

function celebrateAchievement() {
    // Add celebration effects
    const celebration = document.createElement('div');
    celebration.className = 'celebration-effect';
    celebration.innerHTML = '🎊🎉🏆🎉🎊';
    document.body.appendChild(celebration);
    
    setTimeout(() => {
        celebration.remove();
    }, 3000);
}

function showMilestone(text) {
    const milestone = document.createElement('div');
    milestone.className = 'level-milestone';
    milestone.innerHTML = `<div class="milestone-text">${text}</div>`;
    document.body.appendChild(milestone);
    
    // Add screen shake for major milestones
    if (text.includes('STAGE') || text.includes('EXPANDED')) {
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }
    
    // Play milestone sound
    playSound('milestone');
    
    setTimeout(() => {
        milestone.classList.add('fade-out');
        setTimeout(() => milestone.remove(), 500);
    }, 2000);
}

function updateDifficulty() {
    // Dynamic difficulty stages - every 5 levels is a new stage
    gameState.difficultyStage = Math.floor((gameState.level - 1) / 5) + 1;
    
    // Calculate difficulty multiplier based on consecutive wins
    const winBonus = gameState.consecutiveWins * 0.05;
    gameState.difficultyMultiplier = 1.0 + (gameState.level - 1) * 0.5 + winBonus;
    
    // Dynamic difficulty progression based on level
    const difficultyChoice = getDifficultyChoice(gameState.level);
    
    switch(difficultyChoice) {
        case 'speed':
            // Increase speed dramatically
            increaseSpeed();
            //showMilestone('⚡ SPEED BOOST!');
            break;
        case 'grid':
            // Expand grid size
            expandGrid();
            //showMilestone('📐 GRID EXPANDED!');
            break;
        case 'pattern':
            // Increase pattern cells
            increasePatternCells();
           // showMilestone('🎯 MORE CELLS!');
            break;
        case 'combo':
            // Combination of smaller increases
            smallSpeedIncrease();
            smallPatternIncrease();
           // showMilestone('🎮 DIFFICULTY UP!');
            break;
    }
    
    // Always apply gradual speed increase
    updateSpeed();
    
    // Check for mega milestones
    if (gameState.level % 10 === 0) {
        showMilestone(`🏆 STAGE ${gameState.difficultyStage}!`);
        applyMegaDifficultyBoost();
    }
}

function getDifficultyChoice(level) {
    // Rotate between different difficulty increases
    
    // Every 2 levels, expand the grid (faster grid expansion)
    if (level % 2 === 0 && (gameState.gridWidth < 9 || gameState.gridHeight < 9)) {
        return 'grid';
    } else if (level % 3 === 0) {
        return 'pattern';
    } else {
        return 'speed';
    }
}

function getMaxGridSize(level) {
    // Progressive max grid sizes
    if (level < 10) return 5;
    if (level < 20) return 6;
    if (level < 30) return 7;
    if (level < 40) return 8;
    if (level < 50) return 9;
    return 9; // Max 9x9 for extreme levels
}

function increaseSpeed() {
    // Dramatic speed increase (more aggressive)
    gameState.showTime = Math.max(100, gameState.showTime - 120);
    gameState.delayTime = Math.max(30, gameState.delayTime - 40);
}

function expandGrid() {
    // Alternating horizontal and vertical expansion
    gameState.expansionCount++;
    
    const maxWidth = 9;
    const maxHeight = 9;
    
    if (gameState.expansionCount % 2 === 1) {
        // Odd expansions: horizontal
        if (gameState.gridWidth < maxWidth) {
            gameState.gridWidth++;
            initializeGrid();
            adjustCellSize();
        }
    } else {
        // Even expansions: vertical
        if (gameState.gridHeight < maxHeight) {
            gameState.gridHeight++;
            initializeGrid();
            adjustCellSize();
        }
    }
    
    // Adjust pattern cells for new grid (more aggressive increase)
    const totalCells = gameState.gridWidth * gameState.gridHeight;
    const maxCells = Math.floor(totalCells * 0.4);
    gameState.patternCells = Math.min(gameState.patternCells + 1, maxCells);
}

function increasePatternCells() {
    const totalCells = gameState.gridWidth * gameState.gridHeight;
    const maxCells = Math.floor(totalCells * 0.65);
    const increase = Math.floor(2 + gameState.level / 20); // More aggressive increase
    gameState.patternCells = Math.min(gameState.patternCells + increase, maxCells);
}

function smallSpeedIncrease() {
    gameState.showTime = Math.max(100, gameState.showTime - 30);
    gameState.delayTime = Math.max(40, gameState.delayTime - 12);
}

function smallPatternIncrease() {
    const totalCells = gameState.gridWidth * gameState.gridHeight;
    const maxCells = Math.floor(totalCells * 0.5);
    if (gameState.patternCells < maxCells && Math.random() > 0.2) {
        gameState.patternCells += 2; // Add 2 cells instead of 1
    }
}

function applyMegaDifficultyBoost() {
    // Major difficulty spike every 10 levels (more aggressive)
    gameState.showTime = Math.max(80, gameState.showTime * 0.6);
    gameState.delayTime = Math.max(30, gameState.delayTime * 0.6);
    
    // Increase pattern complexity more aggressively
    const bonusCells = Math.floor(gameState.level / 8);
    const maxCells = Math.floor(gameState.gridSize * gameState.gridSize * 0.75);
    gameState.patternCells = Math.min(gameState.patternCells + bonusCells + 2, maxCells);
}

function getTargetGridSize(level) {
    // More progressive grid scaling (starts at 4)
    if (level <= 4) return 4;
    if (level <= 7) return 5;
    if (level <= 10) return 6;
    if (level <= 14) return 7;
    if (level <= 17) return 8;
    return 9;
}

function updateSpeed() {
    // Progressive speed scaling with difficulty multiplier (more aggressive)
    const speedFactor = 1 - (gameState.level - 1) * 0.025;
    
    // Apply base times with progressive reduction (faster decrease)
    gameState.showTime = Math.max(100, Math.floor(gameState.baseShowTime * speedFactor));
    gameState.delayTime = Math.max(40, Math.floor(gameState.baseDelayTime * speedFactor * 0.75));
    
    // Adjust for flash mode (needs more time to memorize all at once)
    if (gameState.gameMode === 'flash') {
        gameState.showTime = Math.max(120, gameState.showTime * 1.8);
    }
    
    // Extra speed boost for high consecutive wins
    if (gameState.consecutiveWins > 3) {
        gameState.showTime = Math.max(100, gameState.showTime - gameState.consecutiveWins * 8);
        gameState.delayTime = Math.max(40, gameState.delayTime - gameState.consecutiveWins * 3);
    }
}

function adjustCellSize() {
    // Dynamically adjust cell size based on grid dimensions
    const grid = document.getElementById('gameGrid');
    const cells = document.querySelectorAll('.grid-cell');
    
    // Calculate cell size based on the larger dimension
    const maxDimension = Math.max(gameState.gridWidth, gameState.gridHeight);
    let cellSize;
    
    switch(maxDimension) {
        case 3: cellSize = '100px'; break;
        case 4: cellSize = '85px'; break;
        case 5: cellSize = '75px'; break;
        case 6: cellSize = '62px'; break;
        case 7: cellSize = '55px'; break;
        case 8: cellSize = '50px'; break;
        case 9: cellSize = '44px'; break;
        default: cellSize = '44px';
    }
    
    cells.forEach(cell => {
        cell.style.width = cellSize;
        cell.style.height = cellSize;
    });
    
    // Add visual feedback for grid changes
    grid.classList.add('grid-transition');
    setTimeout(() => grid.classList.remove('grid-transition'), 300);
}

function endGame() {
    gameState.isPlaying = false;
    
    // Stop timer
    stopTimer();
    stopRoundTimer();
    
    // Log game end (local counters + server score)
    logGameEnd(gameState.level, gameState.score, 'single');
    
    // Update best score locally for immediate UI
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        showMessage('New Best Score!');
        celebrateAchievement();
    }
    
    // Persist score to API and refresh history
    persistMatrixScore(gameState.score, gameState.level, 'single');
    
    // Show game over screen with achievements
    setTimeout(() => {
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalBestScore').textContent = gameState.bestScore;
        document.getElementById('finalLevel').textContent = gameState.level;
        
        // Add achievement text for high levels
        const achievementText = getAchievementText(gameState.level);
        if (achievementText) {
            const gameOverContent = document.querySelector('.game-over h2');
            if (gameOverContent) {
                gameOverContent.textContent = achievementText;
            }
        }
        
        document.getElementById('gameOverScreen').classList.add('active');
    }, 1000);
}

function getAchievementText(level) {
    if (level >= 100) return 'LEGENDARY PLAYER! 🏆';
    if (level >= 75) return 'MASTER OF MEMORY! 🌟';
    if (level >= 50) return 'EXPERT ACHIEVED! ⭐';
    if (level >= 30) return 'IMPRESSIVE RUN! 🎯';
    if (level >= 20) return 'GREAT PERFORMANCE! 👏';
    if (level >= 10) return 'NICE TRY! 👍';
    if (level >= 5) return 'Good effort! Try again!';
    return 'Game Over! One mistake ends it all!';
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('pauseMenu').classList.remove('active');
    
    if (gameState.playerMode === 'multi') {
        // Restart multiplayer game
        resetMultiplayerGame();
        initializeMultiplayerGrids();
        
        if (gameState.timeMode) {
            startMultiplayerTimers();
        }
        
        multiplayerState.currentPlayer = 1;
        updateMultiplayerDisplay();
        updatePlayerVisuals();
        
        setTimeout(() => {
            startMultiplayerRound(1);
        }, 300);
    } else {
        // Restart single player game
        resetGame();
        initializeGrid();
        
        if (gameState.timeMode) {
            startTimer();
        }
        
        startRound();
    }
}

// ===== MULTIPLAYER GAME FUNCTIONS =====

function startMultiplayerGame() {
    resetMultiplayerGame();
    initializeMultiplayerGrids();
    
    // Start timers if time mode is enabled
    if (gameState.timeMode) {
        startMultiplayerTimers();
    }
    
    // Player 1 starts
    multiplayerState.currentPlayer = 1;
    updateMultiplayerDisplay();
    updatePlayerVisuals();
    
    setTimeout(() => {
        startMultiplayerRound(1);
    }, 300);
}

function resetMultiplayerGame() {
    // Get difficulty preset
    const preset = difficultyPresets[currentDifficulty];
    
    multiplayerState = {
        currentPlayer: 1,
        player1: {
            level: 1,
            score: 0,
            currentRound: 1,
            gridSize: Math.max(preset.gridWidth, preset.gridHeight),
            gridWidth: preset.gridWidth,
            gridHeight: preset.gridHeight,
            pattern: [],
            playerPattern: [],
            patternCells: preset.patternCells,
            showTime: preset.baseShowTime,
            delayTime: preset.baseDelayTime,
            canClick: false,
            difficultyStage: 1,
            baseShowTime: preset.baseShowTime,
            baseDelayTime: preset.baseDelayTime,
            basePatternCells: preset.basePatternCells,
            consecutiveWins: 0,
            difficultyMultiplier: 1.0,
            expansionCount: 0,
            timeRemaining: gameState.timeLimit,
            timerInterval: null,
            isActive: true
        },
        player2: {
            level: 1,
            score: 0,
            currentRound: 1,
            gridSize: Math.max(preset.gridWidth, preset.gridHeight),
            gridWidth: preset.gridWidth,
            gridHeight: preset.gridHeight,
            pattern: [],
            playerPattern: [],
            patternCells: preset.patternCells,
            showTime: preset.baseShowTime,
            delayTime: preset.baseDelayTime,
            canClick: false,
            difficultyStage: 1,
            baseShowTime: preset.baseShowTime,
            baseDelayTime: preset.baseDelayTime,
            basePatternCells: preset.basePatternCells,
            consecutiveWins: 0,
            difficultyMultiplier: 1.0,
            expansionCount: 0,
            timeRemaining: gameState.timeLimit,
            timerInterval: null,
            isActive: true
        },
        isPlaying: true,
        isPaused: false
    };
}

function initializeMultiplayerGrids() {
    initializePlayerGrid(1);
    initializePlayerGrid(2);
}

function initializePlayerGrid(playerNum) {
    const player = multiplayerState[`player${playerNum}`];
    const grid = document.getElementById(`p${playerNum}GameGrid`);
    
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${player.gridWidth}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${player.gridHeight}, 1fr)`;
    
    const totalCells = player.gridWidth * player.gridHeight;
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        cell.dataset.player = playerNum;
        cell.tabIndex = -1;
        cell.addEventListener('click', () => handleMultiplayerCellClick(playerNum, i));
        grid.appendChild(cell);
    }
    
    adjustMultiplayerCellSize(playerNum);
}

function adjustMultiplayerCellSize(playerNum) {
    const player = multiplayerState[`player${playerNum}`];
    const cells = document.querySelectorAll(`#p${playerNum}GameGrid .grid-cell`);
    
    const maxDimension = Math.max(player.gridWidth, player.gridHeight);
    let cellSize;
    
    switch(maxDimension) {
        case 3: cellSize = '80px'; break;
        case 4: cellSize = '70px'; break;
        case 5: cellSize = '60px'; break;
        case 6: cellSize = '50px'; break;
        case 7: cellSize = '45px'; break;
        case 8: cellSize = '40px'; break;
        case 9: cellSize = '35px'; break;
        default: cellSize = '35px';
    }
    
    cells.forEach(cell => {
        cell.style.width = cellSize;
        cell.style.height = cellSize;
    });
}

function startMultiplayerRound(playerNum) {
    if (!multiplayerState.isPlaying || multiplayerState.isPaused) return;
    
    const player = multiplayerState[`player${playerNum}`];
    
    // Don't start round for inactive player
    if (!player.isActive) {
        console.log(`Player ${playerNum} is inactive, skipping round`);
        return;
    }
    
    player.canClick = false;
    player.playerPattern = [];
    
    updateMultiplayerDisplay();
    showMultiplayerMessage(playerNum, 'Watch the pattern!');
    
    // Generate unique pattern for this player
    generateMultiplayerPattern(playerNum);
    
    setTimeout(() => {
        showMultiplayerPattern(playerNum);
    }, 1000);
}

function generateMultiplayerPattern(playerNum) {
    const player = multiplayerState[`player${playerNum}`];
    player.pattern = [];
    
    const totalCells = player.gridWidth * player.gridHeight;
    const availableCells = Array.from({length: totalCells}, (_, i) => i);
    
    // Generate unique pattern (different from the other player if same round)
    const otherPlayer = playerNum === 1 ? 2 : 1;
    const otherPlayerState = multiplayerState[`player${otherPlayer}`];
    
    for (let i = 0; i < player.patternCells; i++) {
        let randomIndex, cellIndex;
        let attempts = 0;
        
        do {
            randomIndex = Math.floor(Math.random() * availableCells.length);
            cellIndex = availableCells[randomIndex];
            attempts++;
        } while (attempts < 20 && otherPlayerState.pattern.includes(cellIndex) && availableCells.length > player.patternCells);
        
        player.pattern.push(cellIndex);
        availableCells.splice(randomIndex, 1);
    }
}

function showMultiplayerPattern(playerNum) {
    const player = multiplayerState[`player${playerNum}`];
    const cells = document.querySelectorAll(`#p${playerNum}GameGrid .grid-cell`);
    
    // Show all pattern cells at once, keep for 3 seconds, then hide
    player.pattern.forEach(cellIndex => {
        cells[cellIndex].classList.add('pattern');
    });
    playSound('click');
    
    setTimeout(() => {
        // Hide all patterns after 3 seconds
        player.pattern.forEach(cellIndex => {
            cells[cellIndex].classList.remove('pattern');
        });
        
        // Enable player input shortly after hiding
        setTimeout(() => {
            player.canClick = true;
            showMultiplayerMessage(playerNum, 'Your turn!');
        }, 200);
    }, 3000);
}

function showMultiplayerPatternFlash(playerNum, cells) {
    const player = multiplayerState[`player${playerNum}`];
    
    player.pattern.forEach(cellIndex => {
        cells[cellIndex].classList.add('pattern');
    });
    playSound('click');
    
    const flashDuration = Math.max(player.showTime * 2, 500);
    
    setTimeout(() => {
        player.pattern.forEach(cellIndex => {
            cells[cellIndex].classList.remove('pattern');
        });
        
        setTimeout(() => {
            player.canClick = true;
            showMultiplayerMessage(playerNum, 'Your turn!');
        }, 300);
    }, flashDuration);
}

function showMultiplayerPatternSequential(playerNum, cells) {
    const player = multiplayerState[`player${playerNum}`];
    let index = 0;
    
    const showNextCell = () => {
        if (index < player.pattern.length) {
            const cellIndex = player.pattern[index];
            cells[cellIndex].classList.add('pattern');
            playSound('click');
            
            setTimeout(() => {
                cells[cellIndex].classList.remove('pattern');
                index++;
                setTimeout(showNextCell, player.delayTime);
            }, player.showTime);
        } else {
            setTimeout(() => {
                player.canClick = true;
                showMultiplayerMessage(playerNum, 'Your turn!');
            }, 500);
        }
    };
    
    showNextCell();
}

function handleMultiplayerCellClick(playerNum, index) {
    if (multiplayerState.currentPlayer !== playerNum) return;
    
    const player = multiplayerState[`player${playerNum}`];
    if (!player.canClick || multiplayerState.isPaused || !player.isActive) return;
    
    const cell = document.querySelector(`#p${playerNum}GameGrid [data-index="${index}"]`);
    
    // Toggle selection
    if (player.playerPattern.includes(index)) {
        const indexPosition = player.playerPattern.indexOf(index);
        player.playerPattern.splice(indexPosition, 1);
        cell.classList.remove('selected');
        playSound('click');
        
        if (settings.vibration && navigator.vibrate) {
            navigator.vibrate(30);
        }
        return;
    }
    
    // Select the cell
    player.playerPattern.push(index);
    cell.classList.add('selected');
    playSound('click');
    
    if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Check if player has selected enough cells
    if (player.playerPattern.length === player.pattern.length) {
        player.canClick = false;
        setTimeout(() => checkMultiplayerPattern(playerNum), 500);
    }
}

function checkMultiplayerPattern(playerNum) {
    const player = multiplayerState[`player${playerNum}`];
    const cells = document.querySelectorAll(`#p${playerNum}GameGrid .grid-cell`);
    let correctCount = 0;
    
    // Clear selection classes
    cells.forEach(cell => {
        cell.classList.remove('selected', 'pattern');
    });
    
    // Check each player selection
    player.playerPattern.forEach(index => {
        if (player.pattern.includes(index)) {
            cells[index].classList.add('correct');
            correctCount++;
        } else {
            cells[index].classList.add('wrong');
        }
    });
    
    // Show missed cells
    player.pattern.forEach(index => {
        if (!player.playerPattern.includes(index)) {
            cells[index].classList.add('pattern');
        }
    });
    
    // Calculate score
    let baseScore = correctCount * 10;
    let levelMultiplier = player.level;
    let speedBonus = Math.floor((1000 - player.showTime) / 100);
    let sizeBonus = (player.gridSize - 3) * 5;
    
    const roundScore = baseScore * levelMultiplier + (speedBonus * 10) + (sizeBonus * 10);
    player.score += roundScore;
    
    if (correctCount === player.pattern.length) {
        showMultiplayerMessage(playerNum, `Perfect! +${roundScore} points`, 1000);
        playSound('correct');
        
        // Clear visual feedback - VERY FAST turn switching
        setTimeout(() => {
            cells.forEach(cell => {
                cell.classList.remove('correct', 'wrong', 'pattern');
            });
            
            player.currentRound++;
            player.consecutiveWins++;
            multiplayerLevelUp(playerNum);
            
            updateMultiplayerDisplay();
            
            // Switch to other player - MINIMAL DELAY
            setTimeout(() => {
                switchPlayer();
            }, 100);
        }, 300);
    } else {
        // Player failed - lock this player and continue with the other
        showMultiplayerMessage(playerNum, `${correctCount}/${player.pattern.length} correct. You're out!`);
        playSound('wrong');
        player.isActive = false;
        
        // Check if both players are eliminated
        const otherPlayerNum = playerNum === 1 ? 2 : 1;
        const otherPlayer = multiplayerState[`player${otherPlayerNum}`];
        
        setTimeout(() => {
            cells.forEach(cell => {
                cell.classList.remove('correct', 'wrong', 'pattern');
            });
            
            if (!otherPlayer.isActive) {
                // Both players are out - determine winner
                endMultiplayerGame(player.score > otherPlayer.score ? playerNum : otherPlayerNum);
            } else {
                // Other player is still active - continue with them - VERY FAST
                updatePlayerVisuals();
                multiplayerState.currentPlayer = otherPlayerNum;
                setTimeout(() => {
                    startMultiplayerRound(otherPlayerNum);
                }, 200);
            }
        }, 800);
    }
}

function switchPlayer() {
    // Pause current player's timer
    if (gameState.timeMode) {
        pausePlayerTimer(multiplayerState.currentPlayer);
    }
    
    // Determine next player (skip inactive players)
    const player1 = multiplayerState.player1;
    const player2 = multiplayerState.player2;
    
    // If current player is 1, try to switch to 2
    if (multiplayerState.currentPlayer === 1) {
        if (player2.isActive) {
            multiplayerState.currentPlayer = 2;
        }
        // else stay on player 1 (if player 1 is still active)
    } else {
        // Current player is 2, try to switch to 1
        if (player1.isActive) {
            multiplayerState.currentPlayer = 1;
        }
        // else stay on player 2 (if player 2 is still active)
    }
    
    // Resume new player's timer
    if (gameState.timeMode) {
        resumePlayerTimer(multiplayerState.currentPlayer);
    }
    
    updatePlayerVisuals();
    
    // Start round for active player - INSTANT
    setTimeout(() => {
        startMultiplayerRound(multiplayerState.currentPlayer);
    }, 100);
}

function updatePlayerVisuals() {
    const player1Side = document.getElementById('player1Side');
    const player2Side = document.getElementById('player2Side');
    
    // Add eliminated class for inactive players (game over for them)
    if (!multiplayerState.player1.isActive) {
        player1Side.classList.add('eliminated');
    } else {
        player1Side.classList.remove('eliminated');
    }
    
    if (!multiplayerState.player2.isActive) {
        player2Side.classList.add('eliminated');
    } else {
        player2Side.classList.remove('eliminated');
    }
    
    // Only apply inactive styling if both players are still active (normal turn switching)
    // Don't apply inactive to the active player when other player is eliminated
    if (multiplayerState.player1.isActive && multiplayerState.player2.isActive) {
        // Both players active - normal turn switching
        if (multiplayerState.currentPlayer === 1) {
            player1Side.classList.remove('inactive');
            player2Side.classList.add('inactive');
        } else {
            player1Side.classList.add('inactive');
            player2Side.classList.remove('inactive');
        }
    } else {
        // One player eliminated - remove inactive from active player
        if (multiplayerState.player1.isActive) {
            player1Side.classList.remove('inactive');
        }
        if (multiplayerState.player2.isActive) {
            player2Side.classList.remove('inactive');
        }
    }
}

function multiplayerLevelUp(playerNum) {
    const player = multiplayerState[`player${playerNum}`];
    player.level++;
    
    // Use similar difficulty progression as single player
    player.difficultyStage = Math.floor((player.level - 1) / 5) + 1;
    
    const winBonus = player.consecutiveWins * 0.05;
    player.difficultyMultiplier = 1.0 + (player.level - 1) * 0.1 + winBonus;
    
    const difficultyChoice = getMultiplayerDifficultyChoice(player.level, player);
    
    switch(difficultyChoice) {
        case 'speed':
            multiplayerIncreaseSpeed(player);
            break;
        case 'grid':
            multiplayerExpandGrid(playerNum);
            break;
        case 'pattern':
            multiplayerIncreasePatternCells(player);
            break;
        case 'combo':
            multiplayerSmallSpeedIncrease(player);
            multiplayerSmallPatternIncrease(player);
            break;
    }
    
    // Always apply gradual speed increase
    multiplayerUpdateSpeed(player);
    
    if (player.level % 10 === 0) {
        multiplayerApplyMegaDifficultyBoost(player);
    }
}

function getMultiplayerDifficultyChoice(level, player) {
    // Every 2 levels, expand the grid (faster grid expansion)
    if (level % 2 === 0 && (player.gridWidth < 9 || player.gridHeight < 9)) {
        return 'grid';
    } else if (level % 3 === 0) {
        return 'pattern';
    } else {
        return 'speed';
    }
}

function multiplayerIncreaseSpeed(player) {
    // Match single player speed increase with difficulty-aware minimums
    const preset = difficultyPresets[currentDifficulty];
    const minShowTime = preset.minShowTime || 100;
    const minDelayTime = preset.minDelayTime || 40;
    
    player.showTime = Math.max(minShowTime, player.showTime - 120);
    player.delayTime = Math.max(minDelayTime, player.delayTime - 40);
}

function multiplayerExpandGrid(playerNum) {
    const player = multiplayerState[`player${playerNum}`];
    player.expansionCount++;
    
    const maxWidth = 10;
    const maxHeight = 10;
    
    if (player.expansionCount % 2 === 1) {
        if (player.gridWidth < maxWidth) {
            player.gridWidth++;
            initializePlayerGrid(playerNum);
        }
    } else {
        if (player.gridHeight < maxHeight) {
            player.gridHeight++;
            initializePlayerGrid(playerNum);
        }
    }
    
    // Update gridSize for compatibility (use the larger dimension)
    player.gridSize = Math.max(player.gridWidth, player.gridHeight);
    
    const totalCells = player.gridWidth * player.gridHeight;
    const maxCells = Math.floor(totalCells * 0.4);
    player.patternCells = Math.min(player.patternCells + 1, maxCells);
}

function multiplayerIncreasePatternCells(player) {
    const totalCells = player.gridWidth * player.gridHeight;
    const maxCells = Math.floor(totalCells * 0.65);
    const increase = Math.floor(2 + player.level / 20);
    player.patternCells = Math.min(player.patternCells + increase, maxCells);
}

function multiplayerSmallSpeedIncrease(player) {
    // Match single player small speed increase
    const preset = difficultyPresets[currentDifficulty];
    const minShowTime = preset.minShowTime || 100;
    const minDelayTime = preset.minDelayTime || 40;
    
    player.showTime = Math.max(minShowTime, player.showTime - 30);
    player.delayTime = Math.max(minDelayTime, player.delayTime - 12);
}

function multiplayerSmallPatternIncrease(player) {
    const totalCells = player.gridWidth * player.gridHeight;
    const maxCells = Math.floor(totalCells * 0.5);
    if (player.patternCells < maxCells && Math.random() > 0.2) {
        player.patternCells += 2;
    }
}

function multiplayerApplyMegaDifficultyBoost(player) {
    // Match single player mega boost with difficulty-aware minimums
    const preset = difficultyPresets[currentDifficulty];
    const minShowTime = preset.minShowTime || 100;
    const minDelayTime = preset.minDelayTime || 40;
    
    player.showTime = Math.max(minShowTime, player.showTime * 0.7);
    player.delayTime = Math.max(minDelayTime, player.delayTime * 0.7);
    
    // Increase pattern complexity more aggressively (same as single player)
    const bonusCells = Math.floor(player.level / 8);
    const totalCells = player.gridWidth * player.gridHeight;
    const maxCells = Math.floor(totalCells * 0.75);
    player.patternCells = Math.min(player.patternCells + bonusCells + 2, maxCells);
}

function multiplayerUpdateSpeed(player) {
    // Use same speed scaling as single player
    const speedFactor = 1 - (player.level - 1) * 0.025;
    
    // Get difficulty preset min values
    const preset = difficultyPresets[currentDifficulty];
    const minShowTime = preset.minShowTime || 100;
    const minDelayTime = preset.minDelayTime || 40;
    
    // Apply base times with progressive reduction (same as single player)
    player.showTime = Math.max(minShowTime, Math.floor(player.baseShowTime * speedFactor));
    player.delayTime = Math.max(minDelayTime, Math.floor(player.baseDelayTime * speedFactor * 0.75));
    
    // Adjust for flash mode (same as single player)
    if (gameState.gameMode === 'flash') {
        player.showTime = Math.max(120, player.showTime * 1.8);
    }
    
    // Extra speed boost for high consecutive wins (same as single player)
    if (player.consecutiveWins > 3) {
        player.showTime = Math.max(minShowTime, player.showTime - player.consecutiveWins * 8);
        player.delayTime = Math.max(minDelayTime, player.delayTime - player.consecutiveWins * 3);
    }
}

function startMultiplayerTimers() {
    if (!gameState.timeMode) return;
    
    // Initialize time remaining for both players
    multiplayerState.player1.timeRemaining = gameState.timeLimit;
    multiplayerState.player2.timeRemaining = gameState.timeLimit;
    
    // Show timers
    document.getElementById('p1TimerDisplay').style.display = 'block';
    document.getElementById('p2TimerDisplay').style.display = 'block';
    
    // Start timer for player 1 (who starts first)
    resumePlayerTimer(1);
}

function stopMultiplayerTimers() {
    if (multiplayerState.player1.timerInterval) {
        clearInterval(multiplayerState.player1.timerInterval);
        multiplayerState.player1.timerInterval = null;
    }
    if (multiplayerState.player2.timerInterval) {
        clearInterval(multiplayerState.player2.timerInterval);
        multiplayerState.player2.timerInterval = null;
    }
}

function pausePlayerTimer(playerNum) {
    const player = multiplayerState[`player${playerNum}`];
    if (player.timerInterval) {
        clearInterval(player.timerInterval);
        player.timerInterval = null;
    }
}

function resumePlayerTimer(playerNum) {
    if (!gameState.timeMode) return;
    
    const player = multiplayerState[`player${playerNum}`];
    
    // Clear any existing timer
    if (player.timerInterval) {
        clearInterval(player.timerInterval);
    }
    
    // Start countdown
    player.timerInterval = setInterval(() => {
        if (multiplayerState.isPaused) return;
        
        player.timeRemaining--;
        updateMultiplayerTimerDisplay(playerNum);
        
        if (player.timeRemaining <= 0) {
            clearInterval(player.timerInterval);
            multiplayerTimeUp(playerNum);
        }
    }, 1000);
    
    updateMultiplayerTimerDisplay(playerNum);
}

function updateMultiplayerTimerDisplay(playerNum) {
    const player = multiplayerState[`player${playerNum}`];
    const display = document.getElementById(`p${playerNum}TimeDisplay`);
    if (!display) return;
    
    const minutes = Math.floor(player.timeRemaining / 60);
    const seconds = player.timeRemaining % 60;
    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (player.timeRemaining <= 10) {
        display.style.color = '#D00000';
    } else if (player.timeRemaining <= 30) {
        display.style.color = '#F48C06';
    } else {
        display.style.color = '#FFBA08';
    }
}

function multiplayerTimeUp(playerNum) {
    showMultiplayerMessage(playerNum, 'Time\'s up!');
    playSound('wrong');
    
    const player = multiplayerState[`player${playerNum}`];
    player.isActive = false;
    
    // Check if both players are out
    const otherPlayerNum = playerNum === 1 ? 2 : 1;
    const otherPlayer = multiplayerState[`player${otherPlayerNum}`];
    
    setTimeout(() => {
        if (!otherPlayer.isActive) {
            // Both players are out - determine winner by score
            endMultiplayerGame(player.score > otherPlayer.score ? playerNum : otherPlayerNum);
        } else {
            // Other player is still active - continue with them - VERY FAST
            updatePlayerVisuals();
            multiplayerState.currentPlayer = otherPlayerNum;
            setTimeout(() => {
                startMultiplayerRound(otherPlayerNum);
            }, 200);
        }
    }, 800);
}

function showMultiplayerMessage(playerNum, text, duration = 2000) {
    const messageDisplay = document.getElementById(`p${playerNum}Message`);
    messageDisplay.textContent = text;
    messageDisplay.classList.add('show');
    
    setTimeout(() => {
        messageDisplay.classList.remove('show');
    }, duration);
}

function updateMultiplayerDisplay() {
    // Update Player 1
    document.getElementById('p1LevelDisplay').textContent = multiplayerState.player1.level;
    document.getElementById('p1ScoreDisplay').textContent = multiplayerState.player1.score;
    document.getElementById('p1Round').textContent = multiplayerState.player1.currentRound;
    document.getElementById('p1GridInfo').textContent = `${multiplayerState.player1.gridWidth}x${multiplayerState.player1.gridHeight}`;
    document.getElementById('p1PatternInfo').textContent = `${multiplayerState.player1.patternCells} cells`;
    
    // Update Player 2
    document.getElementById('p2LevelDisplay').textContent = multiplayerState.player2.level;
    document.getElementById('p2ScoreDisplay').textContent = multiplayerState.player2.score;
    document.getElementById('p2Round').textContent = multiplayerState.player2.currentRound;
    document.getElementById('p2GridInfo').textContent = `${multiplayerState.player2.gridWidth}x${multiplayerState.player2.gridHeight}`;
    document.getElementById('p2PatternInfo').textContent = `${multiplayerState.player2.patternCells} cells`;
}

function endMultiplayerGame(winnerNum) {
    multiplayerState.isPlaying = false;
    
    // Stop all timers
    stopMultiplayerTimers();
    
    const winner = multiplayerState[`player${winnerNum}`];
    const loser = multiplayerState[`player${winnerNum === 1 ? 2 : 1}`];
    
    // Log game end (use winner's stats)
    logGameEnd(winner.level, winner.score, 'multi');
    persistMatrixScore(winner.score, winner.level, 'multi');
    
    // Show game over screen
    setTimeout(() => {
        document.getElementById('finalScore').textContent = `Winner: Player ${winnerNum}`;
        document.getElementById('finalBestScore').textContent = `Score: ${winner.score}`;
        document.getElementById('finalLevel').textContent = `Level: ${winner.level}`;
        
        const gameOverContent = document.querySelector('.game-over h2');
        if (gameOverContent) {
            gameOverContent.textContent = `Player ${winnerNum} Wins! 🏆`;
        }
        
        document.getElementById('gameOverScreen').classList.add('active');
    }, 1000);
}

// Display Updates
function updateDisplay() {
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('bestScoreDisplay').textContent = gameState.bestScore;
    document.getElementById('currentRound').textContent = gameState.currentRound;
    
    // Update difficulty multiplier
    const diffMultiplier = document.getElementById('diffMultiplier');
    if (diffMultiplier) {
        diffMultiplier.textContent = `x${gameState.difficultyMultiplier.toFixed(1)}`;
    }
    
    // Update mode indicator
    const modeIndicator = document.getElementById('modeIndicator');
    if (modeIndicator) {
        modeIndicator.textContent = gameState.gameMode === 'flash' ? 'Flash Mode' : 'Sequential Mode';
    }
    
    // Update difficulty indicator in UI
    updateDifficultyDisplay();
}

function updateDifficultyDisplay() {
    // Add visual feedback for difficulty changes
    const grid = document.getElementById('gameGrid');
    
    // Add class based on difficulty stage
    grid.className = `game-grid stage-${gameState.difficultyStage}`;
    
    // Add mode class
    if (gameState.gameMode === 'flash') {
        grid.classList.add('flash-mode');
    }
    
    // Add intensity class based on level
    if (gameState.level > 30) grid.classList.add('extreme-mode');
    if (gameState.level > 50) grid.classList.add('insane-mode');
    
    // Flash effects for different changes
    if (gameState.level % 2 === 0) {
        grid.classList.add('speed-boost');
        setTimeout(() => grid.classList.remove('speed-boost'), 1000);
    }
    
    // Update difficulty info display
    document.getElementById('gridInfo').textContent = `${gameState.gridWidth}x${gameState.gridHeight}`;
    document.getElementById('patternInfo').textContent = `${gameState.patternCells} cells`;
    
    // Update speed indicator with more detailed info
    let speedText = 'Normal';
    let speedClass = 'speed-normal';
    
    if (gameState.showTime <= 800) { speedText = 'Fast'; speedClass = 'speed-fast'; }
    if (gameState.showTime <= 500) { speedText = 'Very Fast'; speedClass = 'speed-veryfast'; }
    if (gameState.showTime <= 300) { speedText = 'Extreme'; speedClass = 'speed-extreme'; }
    if (gameState.showTime <= 200) { speedText = 'Insane!'; speedClass = 'speed-insane'; }
    if (gameState.showTime <= 100) { speedText = 'GODLIKE!'; speedClass = 'speed-godlike'; }
    
    const speedInfo = document.getElementById('speedInfo');
    speedInfo.textContent = speedText;
    speedInfo.className = speedClass;
    
    // Update difficulty multiplier display
    const diffMultiplier = document.getElementById('diffMultiplier');
    if (diffMultiplier) {
        diffMultiplier.textContent = `x${gameState.difficultyMultiplier.toFixed(1)}`;
    }
}

function updateBestScoreDisplay() {
    const bestScoreElements = document.querySelectorAll('#bestScoreDisplay, #finalBestScore');
    bestScoreElements.forEach(el => el.textContent = gameState.bestScore);
}

function showMessage(text, duration = 2000) {
    const messageDisplay = document.getElementById('messageDisplay');
    messageDisplay.textContent = text;
    messageDisplay.style.opacity = '1';
    
    // Add error class for game over messages
    if (text.includes('Game Over')) {
        messageDisplay.classList.add('error-message');
    } else {
        messageDisplay.classList.remove('error-message');
    }

    // The message stays in the header until the next one replaces it
    void duration;
}

// Sound Functions
function playSound(type) {
    if (!settings.sfx) return;
    
    const sounds = {
        click: document.getElementById('clickSound'),
        correct: document.getElementById('correctSound'),
        wrong: document.getElementById('wrongSound'),
        milestone: document.getElementById('correctSound') // Reuse correct sound for milestones
    };
    
    if (sounds[type]) {
        sounds[type].currentTime = 0;
        sounds[type].play().catch(e => console.log('Sound play failed:', e));
    }
}

function toggleMusic() {
    const bgMusic = document.getElementById('bgMusic');
    if (settings.music) {
        bgMusic.play().catch(e => console.log('Music play failed:', e));
    } else {
        bgMusic.pause();
    }
}

// Settings Functions
function toggleSFX() {
    settings.sfx = document.getElementById('sfxToggle').checked;
    saveSettings();
}

function toggleMusic() {
    settings.music = document.getElementById('musicToggle').checked;
    const bgMusic = document.getElementById('bgMusic');
    if (settings.music) {
        bgMusic.play().catch(e => console.log('Music play failed:', e));
    } else {
        bgMusic.pause();
    }
    saveSettings();
}

function toggleVibration() {
    settings.vibration = document.getElementById('vibrationToggle').checked;
    saveSettings();
}

function saveSettings() {
    localStorage.setItem('memoryMatrixSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('memoryMatrixSettings');
    if (saved) {
        settings = JSON.parse(saved);
        document.getElementById('sfxToggle').checked = settings.sfx;
        document.getElementById('musicToggle').checked = settings.music;
        document.getElementById('vibrationToggle').checked = settings.vibration;
    }
}

// Score Management (server-backed)
async function persistMatrixScore(score, level, playerMode) {
    if (!window.HamkarAPI || !window.HamkarAPI.isLoggedIn()) {
        if (window.HamkarAPI) {
            window.HamkarAPI.showToast('Not signed in — score was not saved.', true);
        }
        return;
    }

    const payload = {
        game_type: 'matrix',
        score: score,
        level: level,
        difficulty: currentDifficulty,
        player_mode: playerMode || gameState.playerMode || 'single',
        game_mode: gameState.gameMode,
        time_mode: gameState.timeMode ? `${gameState.timeLimit}s` : 'Unlimited'
    };

    try {
        await window.HamkarAPI.saveScore(payload);
        const user = await window.HamkarAPI.me();
        if (user && typeof user.best_score_matrix === 'number') {
            gameState.bestScore = user.best_score_matrix;
            updateBestScoreDisplay();
        }
        await loadScoreHistory();
        window.HamkarAPI.showToast('Score saved!');
    } catch (err) {
        window.HamkarAPI.showToast(err.message || 'Failed to save score', true);
        console.error('Failed to save matrix score:', err);
    }
}

async function loadBestScore() {
    if (window.HamkarAPI && window.HamkarAPI.isLoggedIn()) {
        try {
            const user = await window.HamkarAPI.me();
            gameState.bestScore = user.best_score_matrix || 0;
            return;
        } catch (err) {
            console.warn('Could not load best score from server:', err);
        }
    }
    gameState.bestScore = 0;
}

function saveBestScore() {
    // Best score is updated on the server when a score is saved
}

function addToScoreHistory() {
    // History is refreshed from the server after persistMatrixScore
}

function saveScoreHistory() {
    // no-op — history lives on the server
}

async function loadScoreHistory() {
    if (!window.HamkarAPI) {
        gameState.scoreHistory = [];
        return;
    }
    try {
        const rows = await window.HamkarAPI.leaderboard('matrix', 20);
        gameState.scoreHistory = rows.map((row) => ({
            score: row.score,
            level: row.level || 0,
            date: new Date(row.created_at).toLocaleDateString(),
            playerName: (window.HamkarAPI && window.HamkarAPI.formatPlayerLabel)
                ? window.HamkarAPI.formatPlayerLabel(row)
                : (row.player_name || row.player_phone || 'Player')
        }));
    } catch (err) {
        console.warn('Could not load leaderboard:', err);
        gameState.scoreHistory = [];
    }
}

function showScoreHistory() {
    showPublicLeaderboard();
}

function showPublicLeaderboard() {
    const title = document.getElementById('scoreHistoryTitle');
    if (title) title.textContent = 'Leaderboard';
    const open = () => {
        updateScoreHistoryDisplay();
        document.getElementById('scoreHistory').classList.add('active');
    };
    if (window.HamkarAPI) {
        loadScoreHistory().then(open);
    } else {
        open();
    }
}

// Game Statistics Functions
function loadGameStats() {
    const saved = localStorage.getItem('memoryMatrixGameStats');
    if (saved) {
        try {
            gameStats = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading game stats:', e);
            saveGameStats(); // Save default stats
        }
    } else {
        saveGameStats();
    }
}

function saveGameStats() {
    localStorage.setItem('memoryMatrixGameStats', JSON.stringify(gameStats));
}

function logGameStart() {
    gameStats.totalGamesPlayed++;
    gameStats.gamesPerDifficulty[currentDifficulty]++;
    gameStats.gamesPerMode[gameState.playerMode]++;
    gameStats.gamesPerGameMode[gameState.gameMode]++;
    gameStats.lastPlayed = new Date().toISOString();
    
    saveGameStats();
    
    console.log(`[GAME LOG] Game Started #${gameStats.totalGamesPlayed}`);
    console.log(`  Mode: ${gameState.playerMode} | Difficulty: ${currentDifficulty} | Type: ${gameState.gameMode}`);
}

function logGameEnd(finalLevel, finalScore, playerMode = 'single') {
    gameStats.totalGamesCompleted++;
    gameStats.totalScore += finalScore;
    
    if (finalLevel > gameStats.highestLevel) {
        gameStats.highestLevel = finalLevel;
    }
    
    // Add to detailed history (keep last 50 games)
    const gameLog = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString(),
        playerMode: playerMode,
        difficulty: currentDifficulty,
        gameMode: gameState.gameMode,
        level: finalLevel,
        score: finalScore,
        timeMode: gameState.timeMode ? `${gameState.timeLimit}s` : 'Unlimited'
    };
    
    gameStats.playHistory.unshift(gameLog);
    if (gameStats.playHistory.length > 50) {
        gameStats.playHistory = gameStats.playHistory.slice(0, 50);
    }
    
    saveGameStats();
    
    console.log(`[GAME LOG] Game Ended #${gameStats.totalGamesCompleted}`);
    console.log(`  Level: ${finalLevel} | Score: ${finalScore}`);
    console.log(`  Total Games: ${gameStats.totalGamesPlayed}`);
}

function getGameStatsReport() {
    const report = {
        summary: {
            totalGamesPlayed: gameStats.totalGamesPlayed,
            totalGamesCompleted: gameStats.totalGamesCompleted,
            completionRate: gameStats.totalGamesPlayed > 0 
                ? ((gameStats.totalGamesCompleted / gameStats.totalGamesPlayed) * 100).toFixed(1) + '%'
                : '0%',
            highestLevel: gameStats.highestLevel,
            totalScore: gameStats.totalScore,
            averageScore: gameStats.totalGamesCompleted > 0 
                ? Math.round(gameStats.totalScore / gameStats.totalGamesCompleted)
                : 0,
            lastPlayed: gameStats.lastPlayed ? new Date(gameStats.lastPlayed).toLocaleString() : 'Never'
        },
        byDifficulty: gameStats.gamesPerDifficulty,
        byMode: gameStats.gamesPerMode,
        byGameMode: gameStats.gamesPerGameMode,
        recentGames: gameStats.playHistory.slice(0, 10)
    };
    
    return report;
}

function exportGameLogs() {
    const report = getGameStatsReport();
    const logText = `
═══════════════════════════════════════════════
    MEMORY MATRIX - GAME STATISTICS REPORT
═══════════════════════════════════════════════

SUMMARY
-------
Total Games Played: ${report.summary.totalGamesPlayed}
Total Games Completed: ${report.summary.totalGamesCompleted}
Completion Rate: ${report.summary.completionRate}
Highest Level Reached: ${report.summary.highestLevel}
Total Score: ${report.summary.totalScore}
Average Score: ${report.summary.averageScore}
Last Played: ${report.summary.lastPlayed}

GAMES BY DIFFICULTY
-------------------
Easy: ${report.byDifficulty.easy}
Mid: ${report.byDifficulty.mid}
Hard: ${report.byDifficulty.hard}
Impossible: ${report.byDifficulty.impossible}

GAMES BY PLAYER MODE
--------------------
Single Player: ${report.byMode.single}
Multiplayer: ${report.byMode.multi}

GAMES BY GAME MODE
------------------
Sequential: ${report.byGameMode.sequential}
Flash: ${report.byGameMode.flash}

RECENT GAME HISTORY (Last 10 Games)
------------------------------------
${gameStats.playHistory.slice(0, 10).map((game, i) => 
    `${i + 1}. ${game.date}
   Mode: ${game.playerMode} | Difficulty: ${game.difficulty} | Type: ${game.gameMode}
   Level: ${game.level} | Score: ${game.score} | Time: ${game.timeMode}`
).join('\n\n')}

═══════════════════════════════════════════════
Generated: ${new Date().toLocaleString()}
═══════════════════════════════════════════════
    `;
    
    // Log to console
    console.log(logText);
    
    // Create downloadable file
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-matrix-stats-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Game statistics exported!', 3000);
    
    return logText;
}

function viewGameStats() {
    const report = getGameStatsReport();
    console.log('═══════════════════════════════════════════════');
    console.log('    MEMORY MATRIX - GAME STATISTICS');
    console.log('═══════════════════════════════════════════════');
    console.log('\nSUMMARY:');
    console.log(`  Total Games Played: ${report.summary.totalGamesPlayed}`);
    console.log(`  Total Games Completed: ${report.summary.totalGamesCompleted}`);
    console.log(`  Completion Rate: ${report.summary.completionRate}`);
    console.log(`  Highest Level: ${report.summary.highestLevel}`);
    console.log(`  Total Score: ${report.summary.totalScore}`);
    console.log(`  Average Score: ${report.summary.averageScore}`);
    console.log(`  Last Played: ${report.summary.lastPlayed}`);
    console.log('\nBY DIFFICULTY:');
    console.log(`  Easy: ${report.byDifficulty.easy}`);
    console.log(`  Mid: ${report.byDifficulty.mid}`);
    console.log(`  Hard: ${report.byDifficulty.hard}`);
    console.log(`  Impossible: ${report.byDifficulty.impossible}`);
    console.log('\nBY PLAYER MODE:');
    console.log(`  Single: ${report.byMode.single}`);
    console.log(`  Multiplayer: ${report.byMode.multi}`);
    console.log('\nBY GAME MODE:');
    console.log(`  Sequential: ${report.byGameMode.sequential}`);
    console.log(`  Flash: ${report.byGameMode.flash}`);
    console.log('\n═══════════════════════════════════════════════');
    
    return report;
}

function updateScoreHistoryDisplay() {
    const scoreList = document.getElementById('scoreList');
    scoreList.innerHTML = '';
    if (gameState.scoreHistory.length === 0) {
        scoreList.innerHTML = '<div class="score-item">No scores yet!</div>';
        return;
    }
    gameState.scoreHistory.slice(0, 10).forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'score-item';
        const player = entry.playerName || 'Player';
        const rank = ['🥇', '🥈', '🥉'][index] || `#${index + 1}`;
        item.innerHTML = `
            <div class="flex">
                <p class="medium-text">${rank} - </p>
                <p class="ml-1">${player}</p>
            </div>
            <p>${entry.score} pts </p>
        `;
        scoreList.appendChild(item);
    });
}
// Share Functions
function shareGame() {
    const shareData = {
        title: 'Memory Matrix',
        text: 'Challenge your memory with Memory Matrix!',
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(err => console.log('Share failed:', err));
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(`Check out Memory Matrix! ${window.location.href}`)
            .then(() => showMessage('Link copied to clipboard!'))
            .catch(err => console.log('Copy failed:', err));
    }
}

function shareScore() {
    const shareData = {
        title: 'Memory Matrix Score',
        text: `I scored ${gameState.score} points and reached level ${gameState.level} in Memory Matrix!`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(err => console.log('Share failed:', err));
    } else {
        // Fallback
        navigator.clipboard.writeText(`I scored ${gameState.score} points in Memory Matrix! ${window.location.href}`)
            .then(() => showMessage('Score copied to clipboard!'))
            .catch(err => console.log('Copy failed:', err));
    }
}

// Other Functions
function showPremium() {
    showMessage('Premium features coming soon!');
}

function rateGame() {
    showMessage('Thanks for rating!');
    // In a real app, this would open app store
}

function installApp() {
    showMessage('Installing...');
    // In a real PWA, this would trigger install prompt
}

function toggleMenu() {
    showSettings();
}

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameState.isPaused) {
        resumeGame();
    }
});

// Click outside to close time settings
document.addEventListener('click', (e) => {
    const timeSettings = document.getElementById('timeSettings');
    const timeModeBtn = document.querySelector('.time-mode-btn');
    
    if (!timeModeBtn.contains(e.target) && !timeSettings.contains(e.target)) {
        timeSettings.style.display = 'none';
    }
});