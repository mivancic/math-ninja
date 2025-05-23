<!DOCTYPE html>
<html lang="hr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Matematički Ninja - Zabavno učenje tablice množenja za djecu">
    <meta name="keywords" content="matematika, tablica množenja, djeca, igra, edukacija">
    <title>Matematički Ninja</title>

    <!-- Stylesheets -->
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/components.css">
    <link rel="stylesheet" href="assets/css/animations.css">
    <link rel="stylesheet" href="assets/css/responsive.css">

    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🥷</text></svg>">
</head>

<body>
    <div class="game-container">
        <!-- Glavni izbornik -->
        <div class="menu-screen active">
            <h1>🥷 Matematički Ninja</h1>
            <div class="ninja-avatar"></div>
            <button class="menu-button" onclick="mathNinja.showLevelSelect()">Nova Igra</button>
            <button class="menu-button" onclick="mathNinja.showStats()">Moje Statistike</button>
            <button class="menu-button" onclick="mathNinja.startDailyChallenge()">Dnevni Izazov</button>
        </div>

        <!-- Odabir razine -->
        <div class="level-select-screen" style="display: none;">
            <h2>Odaberi Tablicu Množenja</h2>
            <div class="level-selector" id="levelSelector"></div>
            <button class="back-button" onclick="mathNinja.showMenu()">Natrag</button>
        </div>

        <!-- Igra -->
        <div class="game-screen">
            <h2>Razina <span id="currentLevel">1</span></h2>
            <div class="score-display">
                <div class="score-item">Bodovi: <span id="score">0</span></div>
                <div class="score-item">Točnost: <span id="accuracy">100</span>%</div>
            </div>
            <div class="timer-bar">
                <div class="timer-fill" id="timerFill"></div>
            </div>
            <div class="question-container">
                <span id="question"></span>
            </div>
            <div class="answer-buttons" id="answerButtons"></div>
            <div class="streak-display">
                Niz: <span id="streak">0</span>
            </div>
        </div>

        <!-- Statistike -->
        <div class="stats-screen">
            <h2>Moje Statistike</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Ukupni Bodovi</h3>
                    <p id="totalScore">0</p>
                </div>
                <div class="stat-card">
                    <h3>Prosječna Točnost</h3>
                    <p id="avgAccuracy">0%</p>
                </div>
                <div class="stat-card">
                    <h3>Najbolji Niz</h3>
                    <p id="bestStreak">0</p>
                </div>
                <div class="stat-card">
                    <h3>Dana Vježbanja</h3>
                    <p id="daysPlayed">0</p>
                </div>
            </div>
            <button class="back-button" onclick="mathNinja.showMenu()">Natrag</button>
        </div>

        <!-- Završetak razine -->
        <div class="level-complete-screen">
            <div class="performance-image" id="performanceImage">🤩</div>
            <div class="performance-title" id="performanceTitle">IZVRSNO!</div>
            <div class="stars-container" id="starsContainer">
                <span class="star">⭐</span>
                <span class="star">⭐</span>
                <span class="star">⭐</span>
            </div>
            <div class="results-container">
                <div class="result-item">
                    <span class="result-label">Bodovi:</span>
                    <span id="finalScore">0</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Točnost:</span>
                    <span id="finalAccuracy">0%</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Najbolji niz:</span>
                    <span id="finalStreak">0</span>
                </div>
            </div>
            <button class="menu-button" onclick="mathNinja.showMenu()">Glavni Izbornik</button>
            <button class="menu-button" onclick="mathNinja.retryLevel()">Ponovi Razinu</button>
        </div>
    </div>

    <!-- Scripts -->
    <script type="module" src="assets/js/app.js"></script>
</body>

</html>