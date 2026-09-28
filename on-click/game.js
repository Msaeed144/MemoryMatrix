/**
 * Memory Match Game - Main Game Logic
 * A fast-paced memory game where players match consecutive symbols
 */

// Game State Management
const GameState = {
    currentScreen: 'main-menu',
    currentPlayer: null,
    gameMode: 'single', // 'single' or 'multi'
    gameTimer: 60,
    score: 0,
    multiplier: 1,
    streak: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    lives: 3,
    previousSymbol: null,
    currentSymbol: null,
    isPlaying: false,
    isPaused: false,
    timerInterval: null,
    backgroundMusic: null,
    symbols: [
        'shape/kashef.png',
        'shape/payesh2-01 copy.png',
        'shape/plania red.png',
        'shape/rasa copy.png',
        'shape/sepandlogo-01.png',
        'shape/Hamkar.png',
        'shape/nak_logo.png'
    ],
    // Multiplayer specific state
    multiplayer: {
        activePlayer: 1, // 1 or 2
        player1: {
            gameTimer: 60,
            score: 0,
            multiplier: 1,
            streak: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            lives: 3,
            previousSymbol: null,
            currentSymbol: null,
            symbolSequence: [] // Pre-generated sequence
        },
        player2: {
            gameTimer: 60,
            score: 0,
            multiplier: 1,
            streak: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            lives: 3,
            previousSymbol: null,
            currentSymbol: null,
            symbolSequence: [] // Pre-generated sequence
        }
    }
};

// Local Storage Keys (settings only — scores live on the server)
const STORAGE_KEYS = {
    SETTINGS: 'memoryMatch_settings'
};

// Initialize Game on Load
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
    loadSettings();
    initializeMusic();
    syncPlayerFromAuth();
});

/**
 * Initialize game data and create assets if needed
 */
function initializeGame() {
    // Load default settings
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        const defaultSettings = {
            gameDuration: 60
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }

    if (prefersReducedMotion() || typeof gsap === 'undefined') return;

    const intro = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
            gsap.to('.menu-container .logo-wrapper', {
                y: -8,
                duration: 2.6,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                stagger: 0.7
            });
        }
    });
    intro.from('.menu-container .logo-wrapper', { y: 20, autoAlpha: 0, stagger: 0.1, duration: 0.6 })
        .from('.game-title', { y: 12, autoAlpha: 0, duration: 0.45 }, '-=0.35')
        .from('#play-btn', { scale: 0.92, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.4)' }, '-=0.25')
        .from('.main-page-btn', { y: 10, autoAlpha: 0, duration: 0.4 }, '-=0.25');

    const playBtn = document.getElementById('play-btn');
    playBtn.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;
        gsap.to(playBtn, { scale: 1.05, duration: 0.4, ease: 'power3.out' });
    });
    playBtn.addEventListener('pointerleave', () => {
        gsap.to(playBtn, { scale: 1, duration: 0.45, ease: 'power3.out' });
    });
    playBtn.addEventListener('pointerdown', () => {
        gsap.to(playBtn, { scale: 0.96, duration: 0.1, ease: 'power2.out' });
    });
}

/**
 * Initialize background music
 */
function initializeMusic() {
    GameState.backgroundMusic = document.getElementById('background-music');
    if (GameState.backgroundMusic) {
        GameState.backgroundMusic.volume = 0.3; // Set volume to 30%
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Main Menu Buttons
    document.getElementById('play-btn').addEventListener('click', onPlayClicked);
    
    // Account / profile Screen
    document.getElementById('continue-play-btn').addEventListener('click', () => {
        if (GameState.currentPlayer) {
            showModeScreen();
        } else {
            onPlayClicked();
        }
    });
    document.getElementById('switch-account-btn').addEventListener('click', () => {
        if (window.HamkarAPI) window.HamkarAPI.logout();
        GameState.currentPlayer = null;
        if (window.HamkarAuth) window.HamkarAuth.renderUserBar();
        onPlayClicked();
    });
    document.getElementById('back-from-account-btn').addEventListener('click', () => showScreen('main-menu'));
    
    // Mode Selection Screen
    document.getElementById('singleplayer-btn').addEventListener('click', selectSinglePlayer);
    document.getElementById('multiplayer-btn').addEventListener('click', selectMultiplayer);
    document.getElementById('back-from-mode-btn').addEventListener('click', showAccountScreen);

    window.addEventListener('hamkar:auth', (e) => {
        setCurrentPlayerFromUser(e.detail);
    });
    window.addEventListener('hamkar:logout', () => {
        GameState.currentPlayer = null;
    });
    
    // Settings Screen
    document.getElementById('timer-select').addEventListener('change', saveSettings);
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('back-from-settings-btn').addEventListener('click', showModeScreen);
    
    // Game Screen (Single Player)
    document.getElementById('pause-btn').addEventListener('click', pauseGame);
    document.getElementById('yes-btn').addEventListener('click', () => handleAnswer(true));
    document.getElementById('no-btn').addEventListener('click', () => handleAnswer(false));
    
    // Multiplayer Game Screen
    document.getElementById('multiplayer-pause-btn').addEventListener('click', pauseGame);
    document.getElementById('yes-btn-p1').addEventListener('click', () => handleMultiplayerAnswer(1, true));
    document.getElementById('no-btn-p1').addEventListener('click', () => handleMultiplayerAnswer(1, false));
    document.getElementById('yes-btn-p2').addEventListener('click', () => handleMultiplayerAnswer(2, true));
    document.getElementById('no-btn-p2').addEventListener('click', () => handleMultiplayerAnswer(2, false));
    
    // Pause Screen
    document.getElementById('resume-btn').addEventListener('click', resumeGame);
    document.getElementById('quit-btn').addEventListener('click', quitToMenu);
    
    // Game Over Screen
    document.getElementById('play-again-btn').addEventListener('click', playAgain);
    document.getElementById('scoreboard-btn').addEventListener('click', () => showScoreboard('gameover-screen'));
    document.getElementById('menu-btn').addEventListener('click', () => showScreen('main-menu'));
    
    // Scoreboard Screen
    document.getElementById('back-from-scoreboard-btn').addEventListener('click', () => {
        showScreen(GameState._scoreboardBack || 'main-menu');
    });

    const leaderboardMenuBtn = document.getElementById('leaderboard-menu-btn');
    if (leaderboardMenuBtn) {
        leaderboardMenuBtn.addEventListener('click', () => showScoreboard('main-menu'));
    }

    document.addEventListener('keydown', (event) => {
        if (event.repeat) return;
        if (GameState.currentScreen !== 'game-screen' || !GameState.isPlaying || GameState.isPaused) return;
        const key = event.key.toLowerCase();
        if (event.key === 'ArrowLeft' || key === 'n') handleAnswer(false);
        if (event.key === 'ArrowRight' || key === 'y') handleAnswer(true);
    });
}

/**
 * Screen Management
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function showScreen(screenId) {
    const next = document.getElementById(screenId);
    const current = document.querySelector('.screen.active');
    if (!next || next === current) return;

    const reveal = () => {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            if (typeof gsap !== 'undefined') {
                gsap.set(screen, { clearProps: 'opacity,visibility,transform' });
            }
        });
        next.classList.add('active');
        GameState.currentScreen = screenId;

        if (prefersReducedMotion() || typeof gsap === 'undefined') return;

        const inner = next.querySelector(
            '.menu-container, .account-container, .mode-container, .settings-container, .pause-container, .gameover-container, .scoreboard-container, .game-content, .multiplayer-container'
        );
        gsap.fromTo(next, { autoAlpha: 0 }, {
            autoAlpha: 1,
            duration: 0.32,
            ease: 'power2.out',
            clearProps: 'opacity,visibility'
        });
        if (inner) {
            gsap.fromTo(inner, { y: 16 }, {
                y: 0,
                duration: 0.48,
                ease: 'power3.out',
                clearProps: 'transform'
            });
        }
    };

    if (current && !prefersReducedMotion() && typeof gsap !== 'undefined') {
        gsap.to(current, {
            autoAlpha: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: reveal
        });
        return;
    }

    reveal();
}

/**
 * Auth / player management (server-backed)
 */
function setCurrentPlayerFromUser(user) {
    if (!user) {
        GameState.currentPlayer = null;
        return;
    }
    GameState.currentPlayer = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        bestScore: user.best_score_match || 0
    };
}

function syncPlayerFromAuth() {
    if (window.HamkarAPI && window.HamkarAPI.isLoggedIn()) {
        const cached = window.HamkarAPI.getCachedUser();
        setCurrentPlayerFromUser(cached);
        window.HamkarAPI.me()
            .then((user) => setCurrentPlayerFromUser(user))
            .catch(() => {});
    }
}

function onPlayClicked() {
    if (!window.HamkarAuth) {
        alert('Auth is not available. Please open the site through the game server URL.');
        return;
    }
    window.HamkarAuth.requireAuth((user) => {
        setCurrentPlayerFromUser(user);
        showAccountScreen();
    });
}

function showAccountScreen() {
    const accountList = document.getElementById('account-list');
    const player = GameState.currentPlayer;

    if (!player) {
        accountList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Sign in to play and save your scores.</p>';
    } else {
        accountList.innerHTML = `
            <div class="account-item" style="cursor: default;">
                <span class="account-name">${escapeHtml(player.name)}</span>
                <span class="account-score">Best: ${player.bestScore || 0}</span>
            </div>
        `;
    }

    showScreen('account-screen');
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Mode Selection
 */
function showModeScreen() {
    showScreen('mode-screen');
}

function selectSinglePlayer() {
    GameState.gameMode = 'single';
    showScreen('settings-screen');
}

function selectMultiplayer() {
    GameState.gameMode = 'multi';
    showScreen('settings-screen');
}

/**
 * Settings Management
 */
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
    if (settings) {
        document.getElementById('timer-select').value = settings.gameDuration;
        GameState.gameTimer = settings.gameDuration;
    }
}

function saveSettings() {
    const gameDuration = parseInt(document.getElementById('timer-select').value);
    const settings = {
        gameDuration: gameDuration
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    GameState.gameTimer = gameDuration;
}

/**
 * Game Logic
 */
function startGame() {
    if (!GameState.currentPlayer) {
        alert('Please select an account first!');
        return;
    }
    
    if (GameState.gameMode === 'single') {
        startSinglePlayerGame();
    } else {
        startMultiplayerGame();
    }
}

function startSinglePlayerGame() {
    // Reset game state
    GameState.score = 0;
    GameState.multiplier = 1;
    GameState.streak = 0;
    GameState.correctAnswers = 0;
    GameState.wrongAnswers = 0;
    GameState.lives = 3;
    GameState.previousSymbol = null;
    GameState.currentSymbol = null;
    GameState.isPlaying = true;
    GameState.isPaused = false;
    
    // Load timer setting
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
    GameState.gameTimer = settings.gameDuration;
    
    // Update UI
    updateScoreDisplay();
    updateTimerDisplay();
    updateMultiplierDisplay();
    updateLivesDisplay();
    
    // Show game screen
    showScreen('game-screen');
    
    // Start background music
    playBackgroundMusic();
    
    // Start timer
    startTimer();
    
    // Show first symbol
    showNextSymbol();
}

function startMultiplayerGame() {
    // Load timer setting
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
    const duration = settings.gameDuration;
    
    // Reset multiplayer state
    GameState.isPlaying = true;
    GameState.isPaused = false;
    GameState.multiplayer.activePlayer = 1;
    
    // Initialize Player 1
    GameState.multiplayer.player1 = {
        gameTimer: duration,
        score: 0,
        multiplier: 1,
        streak: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        lives: 3,
        previousSymbol: null,
        currentSymbol: null,
        symbolSequence: generateSymbolSequence(100)
    };
    
    // Initialize Player 2
    GameState.multiplayer.player2 = {
        gameTimer: duration,
        score: 0,
        multiplier: 1,
        streak: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        lives: 3,
        previousSymbol: null,
        currentSymbol: null,
        symbolSequence: generateSymbolSequence(100)
    };
    
    // Set player names
    document.getElementById('player-1-name').textContent = 'Player 1';
    document.getElementById('player-2-name').textContent = 'Player 2';
    
    // Update UI for both players
    updateMultiplayerUI();
    
    // Show multiplayer game screen
    showScreen('multiplayer-game-screen');
    
    // Start background music
    playBackgroundMusic();
    
    // Start timer
    startMultiplayerTimer();
    
    // Show first symbol for Player 1
    showNextMultiplayerSymbol(1);
    
    // Set Player 1 as active
    setActivePlayer(1);
}

/**
 * Generate a balanced symbol sequence
 * This creates different sequences for each player to prevent cheating
 */
function generateSymbolSequence(length) {
    const sequence = [];
    let previousSymbol = null;
    
    for (let i = 0; i < length; i++) {
        // 40% chance to match previous symbol
        const shouldMatch = Math.random() < 0.4 && previousSymbol !== null;
        
        if (shouldMatch) {
            sequence.push(previousSymbol);
        } else {
            // Select a random symbol (different from previous)
            let newSymbol;
            do {
                newSymbol = GameState.symbols[Math.floor(Math.random() * GameState.symbols.length)];
            } while (newSymbol === previousSymbol && previousSymbol !== null);
            sequence.push(newSymbol);
            previousSymbol = newSymbol;
        }
    }
    
    return sequence;
}

function startTimer() {
    GameState.timerInterval = setInterval(() => {
        if (!GameState.isPaused && GameState.isPlaying) {
            GameState.gameTimer--;
            updateTimerDisplay();
            
            if (GameState.gameTimer <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function showNextSymbol(useSwipeAnimation = false) {
    if (!GameState.isPlaying) return;
    
    // Store previous symbol
    GameState.previousSymbol = GameState.currentSymbol;
    
    // Randomly decide if this should match (40% chance to match)
    const shouldMatch = Math.random() < 0.4 && GameState.previousSymbol !== null;
    
    if (shouldMatch) {
        GameState.currentSymbol = GameState.previousSymbol;
    } else {
        // Select a random symbol (different from previous)
        let newSymbol;
        do {
            newSymbol = GameState.symbols[Math.floor(Math.random() * GameState.symbols.length)];
        } while (newSymbol === GameState.previousSymbol && GameState.previousSymbol !== null);
        GameState.currentSymbol = newSymbol;
    }
    
    const symbolCard = document.getElementById('symbol-card');
    const symbolImage = document.getElementById('symbol-image');
    const cardWrapper = document.getElementById('symbol-card-wrapper');

    cardWrapper.querySelectorAll('.next-card').forEach(card => card.remove());
    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(symbolCard);
        gsap.set(symbolCard, { clearProps: 'transform,opacity,visibility' });
    }
    symbolCard.classList.remove('correct', 'wrong');

    if (useSwipeAnimation && GameState.previousSymbol !== null && !prefersReducedMotion()) {
        const newCard = document.createElement('div');
        newCard.className = 'symbol-card next-card';
        const newImage = document.createElement('img');
        newImage.alt = 'Symbol';
        newImage.src = encodeURI(GameState.currentSymbol);
        newCard.appendChild(newImage);
        cardWrapper.appendChild(newCard);

        gsap.timeline({
            onComplete: () => {
                symbolImage.src = encodeURI(GameState.currentSymbol);
                gsap.set(symbolCard, { clearProps: 'transform,opacity,visibility' });
                newCard.remove();
            }
        })
            .to(symbolCard, {
                xPercent: -108,
                autoAlpha: 0.35,
                scale: 0.96,
                rotation: -3,
                duration: 0.38,
                ease: 'power3.in'
            }, 0)
            .fromTo(newCard, {
                xPercent: 108,
                autoAlpha: 0.4,
                scale: 0.96,
                rotation: 3
            }, {
                xPercent: 0,
                autoAlpha: 1,
                scale: 1,
                rotation: 0,
                duration: 0.46,
                ease: 'power3.out'
            }, 0.05);
        return;
    }

    symbolImage.src = encodeURI(GameState.currentSymbol);
    if (!prefersReducedMotion()) {
        gsap.fromTo(symbolCard, { scale: 0.94, autoAlpha: 0, y: 12 }, {
            scale: 1,
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            ease: 'power3.out',
            clearProps: 'transform,opacity,visibility'
        });
    }
}

function handleAnswer(userAnsweredYes) {
    if (!GameState.isPlaying || GameState.isPaused) return;
    
    // Determine if answer is correct
    const symbolsMatch = GameState.currentSymbol === GameState.previousSymbol;
    const isCorrect = (userAnsweredYes && symbolsMatch) || (!userAnsweredYes && !symbolsMatch);
    
    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
    
    setTimeout(() => {
        showNextSymbol(true);
    }, 220);
}

function handleCorrectAnswer() {
    GameState.correctAnswers++;
    GameState.streak++;
    
    // Update multiplier based on streak
    if (GameState.streak >= 10) {
        GameState.multiplier = 10;
    } else if (GameState.streak >= 5) {
        GameState.multiplier = 5;
    } else if (GameState.streak >= 3) {
        GameState.multiplier = 3;
    } else if (GameState.streak >= 2) {
        GameState.multiplier = 2;
    } else {
        GameState.multiplier = 1;
    }
    
    // Add score (base 100 points * multiplier)
    const points = 100 * GameState.multiplier;
    GameState.score += points;
    
    // Visual feedback
    showFeedback('✓', true);
    flashCard('correct');
    
    // Update displays
    updateScoreDisplay();
    updateMultiplierDisplay();
}

function handleWrongAnswer() {
    GameState.wrongAnswers++;
    GameState.streak = 0;
    GameState.multiplier = 1;
    GameState.lives--;
    
    // Visual feedback
    showFeedback('✗', false);
    flashCard('wrong');
    
    // Update displays
    updateMultiplierDisplay();
    updateLivesDisplay();
    
    // Check if game over (3 strikes)
    if (GameState.lives <= 0) {
        setTimeout(() => {
            endGame();
        }, 250);
    }
}

function showFeedback(text, isCorrect) {
    const feedback = document.getElementById('feedback-animation');
    feedback.textContent = text;
    feedback.className = 'feedback-animation ' + (isCorrect ? 'show-correct' : 'show-wrong');
    gsap.killTweensOf(feedback);
    gsap.fromTo(feedback, {
        autoAlpha: 0,
        scale: 0.72,
        xPercent: -50,
        yPercent: -50,
        y: 8
    }, {
        autoAlpha: 1,
        scale: 1,
        xPercent: -50,
        yPercent: -50,
        y: -8,
        duration: 0.24,
        ease: 'back.out(1.6)',
        onComplete: () => {
            gsap.to(feedback, {
                autoAlpha: 0,
                y: -22,
                duration: 0.26,
                delay: 0.05,
                ease: 'power2.in',
                onComplete: () => {
                    feedback.className = 'feedback-animation';
                }
            });
        }
    });
}

function flashCard(type) {
    const card = document.getElementById('symbol-card');
    card.classList.add(type);
    gsap.killTweensOf(card);

    if (type === 'correct') {
        gsap.fromTo(card, { scale: 1 }, {
            scale: 1.035,
            duration: 0.14,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
        });
    } else {
        gsap.fromTo(card, { x: 0 }, {
            x: 7,
            duration: 0.07,
            yoyo: true,
            repeat: 3,
            ease: 'power1.inOut',
            onComplete: () => gsap.set(card, { clearProps: 'x' })
        });
    }

    setTimeout(() => {
        card.classList.remove(type);
    }, 280);
}

function updateScoreDisplay() {
    document.getElementById('score-display').textContent = GameState.score;
}

function updateTimerDisplay() {
    const minutes = Math.floor(GameState.gameTimer / 60);
    const seconds = GameState.gameTimer % 60;
    document.getElementById('timer-display').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateMultiplierDisplay() {
    const badge = document.getElementById('multiplier-badge');
    badge.textContent = `×${GameState.multiplier}`;
    
    // Change color based on multiplier
    if (GameState.multiplier >= 5) {
        badge.style.background = '#E85D04';
    } else if (GameState.multiplier >= 3) {
        badge.style.background = '#F48C06';
    } else if (GameState.multiplier >= 2) {
        badge.style.background = '#FAA307';
    } else {
        badge.style.background = '#6A040F';
    }
}

function updateLivesDisplay() {
    const livesDisplay = document.getElementById('lives-display');
    const hearts = '❤️'.repeat(GameState.lives) + '🖤'.repeat(3 - GameState.lives);
    livesDisplay.textContent = hearts;
}

function pauseGame() {
    if (!GameState.isPlaying) return;
    
    GameState.isPaused = true;
    pauseBackgroundMusic();
    showScreen('pause-screen');
}

function resumeGame() {
    GameState.isPaused = false;
    playBackgroundMusic();
    
    if (GameState.gameMode === 'single') {
        showScreen('game-screen');
    } else {
        showScreen('multiplayer-game-screen');
    }
}

function quitToMenu() {
    endGame();
    showScreen('main-menu');
}

function endGame() {
    GameState.isPlaying = false;
    clearInterval(GameState.timerInterval);
    stopBackgroundMusic();
    
    // Calculate accuracy
    const totalAnswers = GameState.correctAnswers + GameState.wrongAnswers;
    const accuracy = totalAnswers > 0 ? Math.round((GameState.correctAnswers / totalAnswers) * 100) : 0;
    
    // Update game over screen
    document.getElementById('final-score').textContent = GameState.score;
    document.getElementById('correct-count').textContent = GameState.correctAnswers;
    document.getElementById('wrong-count').textContent = GameState.wrongAnswers;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    
    // Save score to server
    saveScore();
    
    // Show game over screen
    showScreen('gameover-screen');
}

async function saveScore() {
    if (!window.HamkarAPI || !window.HamkarAPI.isLoggedIn()) {
        if (window.HamkarAPI) {
            window.HamkarAPI.showToast('Not signed in — score was not saved.', true);
        }
        return;
    }
    if (!GameState.currentPlayer) {
        syncPlayerFromAuth();
    }

    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"gameDuration":60}');
    const payload = {
        game_type: 'match',
        score: GameState.score,
        correct_answers: GameState.correctAnswers,
        wrong_answers: GameState.wrongAnswers,
        game_duration: settings.gameDuration || GameState.gameTimer || 60
    };

    try {
        const saved = await window.HamkarAPI.saveScore(payload);
        if (GameState.currentPlayer) {
            const best = Math.max(GameState.currentPlayer.bestScore || 0, saved.score);
            GameState.currentPlayer.bestScore = best;
        }
        try {
            const user = await window.HamkarAPI.me();
            setCurrentPlayerFromUser(user);
        } catch (_) { /* ignore */ }
        window.HamkarAPI.showToast('Score saved!');
    } catch (err) {
        window.HamkarAPI.showToast(err.message || 'Failed to save score', true);
        console.error('Failed to save match score:', err);
    }
}

async function showScoreboard(backScreen) {
    GameState._scoreboardBack = backScreen || 'main-menu';
    const scoreboardList = document.getElementById('scoreboard-list');
    scoreboardList.innerHTML = '<p style="text-align: center; color: #666;">Loading…</p>';
    showScreen('scoreboard-screen');

    if (!window.HamkarAPI) {
        scoreboardList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Leaderboard is unavailable.</p>';
        return;
    }

    try {
        const scores = await window.HamkarAPI.leaderboard('match', 20);
        scoreboardList.innerHTML = '';

        if (!scores.length) {
            scoreboardList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No scores yet. Play to set a record!</p>';
            return;
        }

        scores.forEach((score, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'scoreboard-item';
            if (index === 0) scoreItem.classList.add('top-score');

            const date = new Date(score.created_at);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            const name = (window.HamkarAPI && window.HamkarAPI.formatPlayerLabel)
                ? window.HamkarAPI.formatPlayerLabel(score)
                : (score.player_name || 'Player');

            scoreItem.innerHTML = `
                <span class="scoreboard-rank">#${index + 1}</span>
                <div class="scoreboard-info">
                    <div class="scoreboard-name">${escapeHtml(name)}</div>
                    <div class="scoreboard-date">${dateStr}</div>
                </div>
                <span class="scoreboard-score">${score.score}</span>
            `;
            scoreboardList.appendChild(scoreItem);
        });
    } catch (err) {
        scoreboardList.innerHTML = `<p style="text-align: center; color: #9D0208;">${escapeHtml(err.message || 'Could not load leaderboard')}</p>`;
    }
}

function playAgain() {
    startGame();
}

/**
 * Multiplayer Game Functions
 */
function startMultiplayerTimer() {
    GameState.timerInterval = setInterval(() => {
        if (!GameState.isPaused && GameState.isPlaying) {
            const activePlayer = GameState.multiplayer.activePlayer;
            const player = GameState.multiplayer[`player${activePlayer}`];
            
            player.gameTimer--;
            updateMultiplayerTimerDisplay(activePlayer);
            
            if (player.gameTimer <= 0) {
                endMultiplayerGame(activePlayer === 1 ? 2 : 1); // Other player wins
            }
        }
    }, 1000);
}

function setActivePlayer(playerNum) {
    GameState.multiplayer.activePlayer = playerNum;
    
    // Update UI to show active/inactive states
    const player1Side = document.getElementById('player-1-side');
    const player2Side = document.getElementById('player-2-side');
    
    if (playerNum === 1) {
        player1Side.classList.remove('inactive');
        player2Side.classList.add('inactive');
    } else {
        player1Side.classList.add('inactive');
        player2Side.classList.remove('inactive');
    }
}

function showNextMultiplayerSymbol(playerNum) {
    if (!GameState.isPlaying) return;
    
    const player = GameState.multiplayer[`player${playerNum}`];
    
    // Store previous symbol
    player.previousSymbol = player.currentSymbol;
    
    // Get next symbol from the pre-generated sequence
    const currentIndex = player.correctAnswers + player.wrongAnswers;
    if (currentIndex >= player.symbolSequence.length) {
        // Regenerate if we run out
        player.symbolSequence = generateSymbolSequence(100);
    }
    
    player.currentSymbol = player.symbolSequence[currentIndex];
    
    // Update the image
    const symbolImage = document.getElementById(`symbol-image-p${playerNum}`);
    const symbolCard = document.getElementById(`symbol-card-p${playerNum}`);
    
    symbolImage.src = encodeURI(player.currentSymbol);

    if (!prefersReducedMotion()) {
        gsap.killTweensOf(symbolCard);
        gsap.fromTo(symbolCard, { y: 10, autoAlpha: 0.4, scale: 0.96 }, {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.36,
            ease: 'power3.out',
            clearProps: 'transform,opacity,visibility'
        });
    }
}

function handleMultiplayerAnswer(playerNum, userAnsweredYes) {
    if (!GameState.isPlaying || GameState.isPaused) return;
    
    // Only allow the active player to answer
    if (GameState.multiplayer.activePlayer !== playerNum) return;
    
    const player = GameState.multiplayer[`player${playerNum}`];
    
    // Determine if answer is correct
    const symbolsMatch = player.currentSymbol === player.previousSymbol;
    const isCorrect = (userAnsweredYes && symbolsMatch) || (!userAnsweredYes && !symbolsMatch);
    
    if (isCorrect) {
        handleMultiplayerCorrectAnswer(playerNum);
    } else {
        handleMultiplayerWrongAnswer(playerNum);
    }
    
    // Show next symbol after brief delay
    setTimeout(() => {
        showNextMultiplayerSymbol(playerNum);
    }, 100);
    
    // Switch to other player
    setTimeout(() => {
        const nextPlayer = playerNum === 1 ? 2 : 1;
        setActivePlayer(nextPlayer);
    }, 500);
}

function handleMultiplayerCorrectAnswer(playerNum) {
    const player = GameState.multiplayer[`player${playerNum}`];
    
    player.correctAnswers++;
    player.streak++;
    
    // Update multiplier based on streak
    if (player.streak >= 10) {
        player.multiplier = 10;
    } else if (player.streak >= 5) {
        player.multiplier = 5;
    } else if (player.streak >= 3) {
        player.multiplier = 3;
    } else if (player.streak >= 2) {
        player.multiplier = 2;
    } else {
        player.multiplier = 1;
    }
    
    // Add score
    const points = 100 * player.multiplier;
    player.score += points;
    
    // Visual feedback
    showMultiplayerFeedback(playerNum, '✓', true);
    flashMultiplayerCard(playerNum, 'correct');
    
    // Update displays
    updateMultiplayerUI();
}

function handleMultiplayerWrongAnswer(playerNum) {
    const player = GameState.multiplayer[`player${playerNum}`];
    
    player.wrongAnswers++;
    player.streak = 0;
    player.multiplier = 1;
    player.lives--;
    
    // Visual feedback
    showMultiplayerFeedback(playerNum, '✗', false);
    flashMultiplayerCard(playerNum, 'wrong');
    
    // Update displays
    updateMultiplayerUI();
    
    // Check if player lost
    if (player.lives <= 0) {
        setTimeout(() => {
            const winnerNum = playerNum === 1 ? 2 : 1;
            endMultiplayerGame(winnerNum);
        }, 500);
    }
}

function showMultiplayerFeedback(playerNum, text, isCorrect) {
    showFeedback(text, isCorrect);
}

function flashMultiplayerCard(playerNum, type) {
    const card = document.getElementById(`symbol-card-p${playerNum}`);
    card.classList.add(type);
    gsap.killTweensOf(card);

    if (type === 'wrong') {
        gsap.fromTo(card, { x: 0 }, {
            x: 6,
            duration: 0.07,
            yoyo: true,
            repeat: 3,
            ease: 'power1.inOut',
            onComplete: () => gsap.set(card, { clearProps: 'x' })
        });
    } else {
        gsap.fromTo(card, { scale: 1 }, {
            scale: 1.03,
            duration: 0.14,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
        });
    }

    setTimeout(() => {
        card.classList.remove(type);
    }, 280);
}

function updateMultiplayerUI() {
    // Update Player 1
    updateMultiplayerScoreDisplay(1);
    updateMultiplayerTimerDisplay(1);
    updateMultiplayerMultiplierDisplay(1);
    updateMultiplayerLivesDisplay(1);
    
    // Update Player 2
    updateMultiplayerScoreDisplay(2);
    updateMultiplayerTimerDisplay(2);
    updateMultiplayerMultiplierDisplay(2);
    updateMultiplayerLivesDisplay(2);
}

function updateMultiplayerScoreDisplay(playerNum) {
    const player = GameState.multiplayer[`player${playerNum}`];
    document.getElementById(`score-display-p${playerNum}`).textContent = player.score;
}

function updateMultiplayerTimerDisplay(playerNum) {
    const player = GameState.multiplayer[`player${playerNum}`];
    const minutes = Math.floor(player.gameTimer / 60);
    const seconds = player.gameTimer % 60;
    document.getElementById(`timer-display-p${playerNum}`).textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateMultiplayerMultiplierDisplay(playerNum) {
    const player = GameState.multiplayer[`player${playerNum}`];
    const badge = document.getElementById(`multiplier-badge-p${playerNum}`);
    badge.textContent = `×${player.multiplier}`;
    
    // Change color based on multiplier
    if (player.multiplier >= 5) {
        badge.style.background = '#E85D04';
    } else if (player.multiplier >= 3) {
        badge.style.background = '#F48C06';
    } else if (player.multiplier >= 2) {
        badge.style.background = '#FAA307';
    } else {
        badge.style.background = '#6A040F';
    }
}

function updateMultiplayerLivesDisplay(playerNum) {
    const player = GameState.multiplayer[`player${playerNum}`];
    const livesDisplay = document.getElementById(`lives-display-p${playerNum}`);
    const hearts = '❤️'.repeat(player.lives) + '🖤'.repeat(3 - player.lives);
    livesDisplay.textContent = hearts;
}

function endMultiplayerGame(winnerNum) {
    GameState.isPlaying = false;
    clearInterval(GameState.timerInterval);
    stopBackgroundMusic();
    
    const winner = GameState.multiplayer[`player${winnerNum}`];
    const loser = GameState.multiplayer[`player${winnerNum === 1 ? 2 : 1}`];
    
    // Calculate accuracies
    const winnerTotal = winner.correctAnswers + winner.wrongAnswers;
    const winnerAccuracy = winnerTotal > 0 ? Math.round((winner.correctAnswers / winnerTotal) * 100) : 0;
    
    const loserTotal = loser.correctAnswers + loser.wrongAnswers;
    const loserAccuracy = loserTotal > 0 ? Math.round((loser.correctAnswers / loserTotal) * 100) : 0;
    
    // Update game over screen with multiplayer results
    document.getElementById('final-score').textContent = `Player ${winnerNum} Wins!`;
    document.getElementById('correct-count').textContent = `P${winnerNum}: ${winner.correctAnswers} | P${winnerNum === 1 ? 2 : 1}: ${loser.correctAnswers}`;
    document.getElementById('wrong-count').textContent = `P${winnerNum}: ${winner.wrongAnswers} | P${winnerNum === 1 ? 2 : 1}: ${loser.wrongAnswers}`;
    document.getElementById('accuracy').textContent = `P${winnerNum}: ${winnerAccuracy}% | P${winnerNum === 1 ? 2 : 1}: ${loserAccuracy}%`;
    
    // Save winner's score
    GameState.score = winner.score;
    GameState.correctAnswers = winner.correctAnswers;
    GameState.wrongAnswers = winner.wrongAnswers;
    saveScore();
    
    // Show game over screen
    showScreen('gameover-screen');
}

/**
 * Music Functions
 */
function playBackgroundMusic() {
    if (GameState.backgroundMusic) {
        GameState.backgroundMusic.play().catch(err => {
            console.log('Music autoplay blocked. User interaction required.');
        });
    }
}

function pauseBackgroundMusic() {
    if (GameState.backgroundMusic) {
        GameState.backgroundMusic.pause();
    }
}

function stopBackgroundMusic() {
    if (GameState.backgroundMusic) {
        GameState.backgroundMusic.pause();
        GameState.backgroundMusic.currentTime = 0;
    }
}

/**
 * Utility Functions
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Prevent default behavior on buttons
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        e.preventDefault();
    }
});

console.log('Memory Match Game Loaded Successfully!');

