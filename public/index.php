<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Matematički Ninja</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
        }

        .game-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 90%;
            text-align: center;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
            0%, 100% { text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 255, 255, 0.5); }
            50% { text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.8); }
        }

        .menu-screen, .game-screen, .stats-screen, .level-complete-screen {
            display: none;
        }

        .menu-screen.active, .game-screen.active, .stats-screen.active, .level-complete-screen.active {
            display: block;
        }

        .ninja-avatar {
            width: 150px;
            height: 150px;
            background: #333;
            border-radius: 50%;
            margin: 20px auto;
            position: relative;
            overflow: hidden;
            animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .ninja-avatar::before {
            content: "🥷";
            font-size: 100px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        .menu-button {
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            border: none;
            color: white;
            padding: 15px 30px;
            font-size: 1.2em;
            border-radius: 30px;
            margin: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }

        .menu-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }

        .question-container {
            background: rgba(255, 255, 255, 0.2);
            padding: 30px;
            border-radius: 15px;
            margin: 20px 0;
            font-size: 2em;
            animation: slideIn 0.5s ease;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .answer-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px auto;
            max-width: 400px;
        }

        .answer-button {
            background: rgba(255, 255, 255, 0.9);
            border: none;
            color: #333;
            padding: 20px;
            font-size: 1.5em;
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: bold;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .answer-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            background: white;
        }

        .answer-button:active {
            transform: translateY(0);
        }

        .answer-button.correct-answer {
            background: #4caf50;
            color: white;
            animation: correctPulse 0.6s ease;
        }

        .answer-button.wrong-answer {
            background: #f44336;
            color: white;
            animation: shake 0.5s ease;
        }

        @keyframes correctPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }

        .timer-bar {
            width: 100%;
            height: 20px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
        }

        .timer-fill {
            height: 100%;
            background: linear-gradient(90deg, #4caf50, #8bc34a);
            transition: width 0.1s linear;
            border-radius: 10px;
        }

        .score-display {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            flex-wrap: wrap;
        }

        .score-item {
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 20px;
            margin: 5px;
            min-width: 120px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 15px;
            transition: transform 0.3s ease;
        }

        .stat-card:hover {
            transform: scale(1.05);
        }

        .back-button {
            background: rgba(255, 255, 255, 0.3);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            margin-top: 20px;
            transition: all 0.3s ease;
        }

        .back-button:hover {
            background: rgba(255, 255, 255, 0.4);
        }

        .streak-display {
            font-size: 1.5em;
            margin: 10px 0;
            animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .level-selector {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin: 20px 0;
        }

        .level-button {
            background: rgba(255, 255, 255, 0.3);
            border: none;
            color: white;
            padding: 20px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1.2em;
            transition: all 0.3s ease;
            position: relative;
        }

        .level-button:hover {
            background: rgba(255, 255, 255, 0.4);
            transform: scale(1.05);
        }

        .level-button.completed::after {
            content: "⭐";
            position: absolute;
            top: 5px;
            right: 5px;
            font-size: 0.8em;
        }

        .feedback {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3em;
            animation: feedbackAnim 1s ease;
            pointer-events: none;
            z-index: 1000;
        }

        @keyframes feedbackAnim {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }

        .correct { color: #4caf50; }
        .incorrect { color: #f44336; }

        .performance-image {
            width: 200px;
            height: 200px;
            margin: 20px auto;
            font-size: 150px;
            animation: celebrate 1s ease-in-out;
        }

        @keyframes celebrate {
            0% { transform: scale(0) rotate(0deg); }
            50% { transform: scale(1.2) rotate(180deg); }
            100% { transform: scale(1) rotate(360deg); }
        }

        .performance-title {
            font-size: 2em;
            margin: 20px 0;
            font-weight: bold;
            animation: slideIn 0.5s ease;
        }

        .results-container {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
        }

        .result-item {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 1.2em;
        }

        .result-label {
            font-weight: bold;
        }

        .stars-container {
            margin: 20px 0;
            font-size: 50px;
        }

        .star {
            display: inline-block;
            animation: starPop 0.5s ease;
            animation-fill-mode: both;
        }

        .star:nth-child(1) { animation-delay: 0.2s; }
        .star:nth-child(2) { animation-delay: 0.4s; }
        .star:nth-child(3) { animation-delay: 0.6s; }

        @keyframes starPop {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(180deg); }
            100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }

        @media (max-width: 600px) {
            h1 { font-size: 2em; }
            .question-container { font-size: 1.5em; }
            .answer-button { font-size: 1.2em; }
            .level-selector { grid-template-columns: repeat(3, 1fr); }
        }
    </style>
</head>
<body>
    <div class="game-container">
        <!-- Glavni izbornik -->
        <div class="menu-screen active">
            <h1>🥷 Matematički Ninja</h1>
            <div class="ninja-avatar"></div>
            <button class="menu-button" onclick="showLevelSelect()">Nova Igra</button>
            <button class="menu-button" onclick="showStats()">Moje Statistike</button>
            <button class="menu-button" onclick="startDailyChallenge()">Dnevni Izazov</button>
        </div>

        <!-- Odabir razine -->
        <div class="level-select-screen" style="display: none;">
            <h2>Odaberi Tablicu Množenja</h2>
            <div class="level-selector" id="levelSelector"></div>
            <button class="back-button" onclick="showMenu()">Natrag</button>
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
                🔥 Niz: <span id="streak">0</span>
            </div>
            <button class="back-button" onclick="showMenu()">Prekini Igru</button>
        </div>

        <!-- Statistike -->
        <div class="stats-screen">
            <h2>📊 Moje Statistike</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>🏆 Ukupni Bodovi</h3>
                    <p id="totalScore">0</p>
                </div>
                <div class="stat-card">
                    <h3>🎯 Prosječna Točnost</h3>
                    <p id="avgAccuracy">0%</p>
                </div>
                <div class="stat-card">
                    <h3>⚡ Najbolji Niz</h3>
                    <p id="bestStreak">0</p>
                </div>
                <div class="stat-card">
                    <h3>📅 Dani Vježbanja</h3>
                    <p id="daysPlayed">0</p>
                </div>
            </div>
            <button class="back-button" onclick="showMenu()">Natrag</button>
        </div>

        <!-- Završni zaslon razine -->
        <div class="level-complete-screen">
            <h2>Razina Završena!</h2>
            <div class="performance-image" id="performanceImage"></div>
            <div class="performance-title" id="performanceTitle"></div>
            <div class="results-container">
                <div class="result-item">
                    <span class="result-label">Bodovi:</span>
                    <span class="result-value" id="finalScore">0</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Točnost:</span>
                    <span class="result-value" id="finalAccuracy">0%</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Najbolji niz:</span>
                    <span class="result-value" id="finalStreak">0</span>
                </div>
                <div class="stars-container" id="starsContainer"></div>
            </div>
            <button class="menu-button" onclick="showMenu()">Glavni Izbornik</button>
            <button class="menu-button" onclick="retryLevel()">Ponovi Razinu</button>
        </div>
    </div>

    <script>
        // Globalne varijable
        let currentLevel = 1;
        let score = 0;
        let streak = 0;
        let maxStreak = 0;
        let questionsAnswered = 0;
        let correctAnswers = 0;
        let timerInterval = null;
        let currentAnswer = 0;
        let timeLimit = 10000;

        // Statistike
        let stats = {
            totalScore: 0,
            gamesPlayed: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            bestStreak: 0,
            completedLevels: [],
            lastPlayed: null,
            daysPlayed: []
        };

        // Učitaj statistike
        function loadStats() {
            try {
                const saved = localStorage.getItem('mathNinjaStats');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    stats = { ...stats, ...parsed };
                }
            } catch (e) {
                console.log('Nema spremljenih statistika');
            }
        }

        // Spremi statistike
        function saveStats() {
            try {
                localStorage.setItem('mathNinjaStats', JSON.stringify(stats));
            } catch (e) {
                console.log('Ne mogu spremiti statistike');
            }
        }

        // Prikaz glavnog izbornika
        function showMenu() {
            document.querySelector('.menu-screen').classList.add('active');
            document.querySelector('.game-screen').classList.remove('active');
            document.querySelector('.stats-screen').classList.remove('active');
            document.querySelector('.level-select-screen').style.display = 'none';
            document.querySelector('.level-complete-screen').classList.remove('active');
            clearInterval(timerInterval);
        }

        // Prikaz odabira razine
        function showLevelSelect() {
            document.querySelector('.menu-screen').classList.remove('active');
            document.querySelector('.level-select-screen').style.display = 'block';
            
            const selector = document.getElementById('levelSelector');
            selector.innerHTML = '';
            
            for (let i = 1; i <= 10; i++) {
                const button = document.createElement('button');
                button.className = 'level-button';
                if (stats.completedLevels.includes(i)) {
                    button.classList.add('completed');
                }
                button.textContent = i;
                button.onclick = () => startGame(i);
                selector.appendChild(button);
            }
        }

        // Započni igru
        function startGame(level) {
            currentLevel = level;
            score = 0;
            streak = 0;
            maxStreak = 0;
            questionsAnswered = 0;
            correctAnswers = 0;
            
            document.querySelector('.level-select-screen').style.display = 'none';
            document.querySelector('.game-screen').classList.add('active');
            document.getElementById('currentLevel').textContent = level;
            
            updateDisplay();
            nextQuestion();
            
            // Zabilježi dan igranja
            const today = new Date().toDateString();
            if (!stats.daysPlayed.includes(today)) {
                stats.daysPlayed.push(today);
            }
            stats.lastPlayed = today;
            saveStats();
        }

        // Generiraj novo pitanje
        function nextQuestion() {
            const num1 = currentLevel === 0 ? Math.floor(Math.random() * 10) + 1 : currentLevel;
            const num2 = Math.floor(Math.random() * 10) + 1;
            currentAnswer = num1 * num2;
            
            document.getElementById('question').textContent = `${num1} × ${num2} = `;
            
            generateAnswerButtons();
            startTimer();
        }

        // Pokreni timer
        function startTimer() {
            clearInterval(timerInterval);
            let timeLeft = timeLimit;
            const timerFill = document.getElementById('timerFill');
            timerFill.style.width = '100%';
            
            timerInterval = setInterval(() => {
                timeLeft -= 100;
                const percentage = (timeLeft / timeLimit) * 100;
                timerFill.style.width = percentage + '%';
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    handleTimeout();
                }
            }, 100);
        }

        // Generiraj gumbove s odgovorima
        function generateAnswerButtons() {
            const answersContainer = document.getElementById('answerButtons');
            answersContainer.innerHTML = '';
            
            const answers = [currentAnswer];
            
            while (answers.length < 4) {
                let wrongAnswer;
                const variation = Math.floor(Math.random() * 3);
                
                switch(variation) {
                    case 0:
                        wrongAnswer = currentAnswer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
                        break;
                    case 1:
                        const divisor = Math.floor(currentAnswer / currentLevel) || 1;
                        wrongAnswer = currentLevel * (divisor + (Math.random() > 0.5 ? 1 : -1));
                        break;
                    case 2:
                        wrongAnswer = Math.floor(Math.random() * (currentAnswer * 2)) + 1;
                        break;
                }
                
                if (wrongAnswer > 0 && !answers.includes(wrongAnswer)) {
                    answers.push(wrongAnswer);
                }
            }
            
            answers.sort(() => Math.random() - 0.5);
            
            answers.forEach(answer => {
                const button = document.createElement('button');
                button.className = 'answer-button';
                button.textContent = answer;
                button.onclick = () => selectAnswer(answer, button);
                answersContainer.appendChild(button);
            });
        }

        // Odaberi odgovor
        function selectAnswer(answer, button) {
            clearInterval(timerInterval);
            
            const allButtons = document.querySelectorAll('.answer-button');
            allButtons.forEach(btn => {
                btn.onclick = null;
                btn.style.cursor = 'default';
            });
            
            questionsAnswered++;
            
            if (answer === currentAnswer) {
                correctAnswers++;
                score += 10 + Math.floor(streak / 3) * 5;
                streak++;
                if (streak > maxStreak) {
                    maxStreak = streak;
                }
                button.classList.add('correct-answer');
                showFeedback('✓', 'correct');
            } else {
                streak = 0;
                button.classList.add('wrong-answer');
                showFeedback('✗', 'incorrect');
                
                allButtons.forEach(btn => {
                    if (parseInt(btn.textContent) === currentAnswer) {
                        btn.classList.add('correct-answer');
                    }
                });
            }
            
            updateDisplay();
            
            if (questionsAnswered < 10) {
                setTimeout(() => nextQuestion(), 1500);
            } else {
                setTimeout(() => endGame(), 1500);
            }
        }

        // Rukuj timeout
        function handleTimeout() {
            questionsAnswered++;
            streak = 0;
            showFeedback('⏰', 'incorrect');
            
            const allButtons = document.querySelectorAll('.answer-button');
            allButtons.forEach(btn => {
                btn.onclick = null;
                if (parseInt(btn.textContent) === currentAnswer) {
                    btn.classList.add('correct-answer');
                }
            });
            
            updateDisplay();
            
            if (questionsAnswered < 10) {
                setTimeout(() => nextQuestion(), 1500);
            } else {
                setTimeout(() => endGame(), 1500);
            }
        }

        // Prikaži povratnu informaciju
        function showFeedback(text, type) {
            const feedback = document.createElement('div');
            feedback.className = `feedback ${type}`;
            feedback.textContent = text;
            document.body.appendChild(feedback);
            
            setTimeout(() => {
                feedback.remove();
            }, 1000);
        }

        // Ažuriraj prikaz
        function updateDisplay() {
            document.getElementById('score').textContent = score;
            document.getElementById('accuracy').textContent = Math.round((correctAnswers / Math.max(questionsAnswered, 1)) * 100);
            document.getElementById('streak').textContent = streak;
        }

        // Završi igru
        function endGame() {
            clearInterval(timerInterval);
            
            stats.totalScore += score;
            stats.gamesPlayed++;
            stats.totalQuestions += questionsAnswered;
            stats.totalCorrect += correctAnswers;
            
            const accuracy = Math.round((correctAnswers / questionsAnswered) * 100);
            
            if (accuracy >= 80 && !stats.completedLevels.includes(currentLevel) && currentLevel !== 0) {
                stats.completedLevels.push(currentLevel);
            }
            
            if (maxStreak > stats.bestStreak) {
                stats.bestStreak = maxStreak;
            }
            
            saveStats();
            showLevelComplete(accuracy);
        }

        // Prikaži završni zaslon razine
        function showLevelComplete(accuracy) {
            document.querySelector('.game-screen').classList.remove('active');
            document.querySelector('.level-complete-screen').classList.add('active');
            
            let performanceData;
            if (accuracy < 50) {
                performanceData = {
                    emoji: '😟',
                    title: 'Trebamo još vježbati!',
                    stars: 0,
                    color: '#f44336'
                };
            } else if (accuracy < 70) {
                performanceData = {
                    emoji: '🙂',
                    title: 'Dobro!',
                    stars: 1,
                    color: '#ff9800'
                };
            } else if (accuracy < 85) {
                performanceData = {
                    emoji: '😊',
                    title: 'Super!',
                    stars: 2,
                    color: '#ffc107'
                };
            } else if (accuracy < 95) {
                performanceData = {
                    emoji: '😄',
                    title: 'Odlično!',
                    stars: 3,
                    color: '#8bc34a'
                };
            } else {
                performanceData = {
                    emoji: '🤩',
                    title: 'IZVRSNO!',
                    stars: 3,
                    color: '#4caf50'
                };
            }
            
            document.getElementById('performanceImage').innerHTML = performanceData.emoji;
            document.getElementById('performanceTitle').textContent = performanceData.title;
            document.getElementById('performanceTitle').style.color = performanceData.color;
            
            document.getElementById('finalScore').textContent = score;
            document.getElementById('finalAccuracy').textContent = accuracy + '%';
            document.getElementById('finalStreak').textContent = maxStreak;
            
            const starsContainer = document.getElementById('starsContainer');
            starsContainer.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const star = document.createElement('span');
                star.className = 'star';
                star.textContent = i < performanceData.stars ? '⭐' : '☆';
                starsContainer.appendChild(star);
            }
        }

        // Ponovi razinu
        function retryLevel() {
            document.querySelector('.level-complete-screen').classList.remove('active');
            if (currentLevel === 0) {
                startDailyChallenge();
            } else {
                startGame(currentLevel);
            }
        }

        // Prikaži statistike
        function showStats() {
            document.querySelector('.menu-screen').classList.remove('active');
            document.querySelector('.stats-screen').classList.add('active');
            
            document.getElementById('totalScore').textContent = stats.totalScore;
            document.getElementById('avgAccuracy').textContent = Math.round((stats.totalCorrect / Math.max(stats.totalQuestions, 1)) * 100) + '%';
            document.getElementById('bestStreak').textContent = stats.bestStreak;
            document.getElementById('daysPlayed').textContent = stats.daysPlayed.length;
        }

        // Dnevni izazov
        function startDailyChallenge() {
            currentLevel = 0;
            score = 0;
            streak = 0;
            maxStreak = 0;
            questionsAnswered = 0;
            correctAnswers = 0;
            timeLimit = 8000;
            
            document.querySelector('.menu-screen').classList.remove('active');
            document.querySelector('.game-screen').classList.add('active');
            document.getElementById('currentLevel').textContent = 'Dnevni Izazov';
            
            updateDisplay();
            nextQuestion();
        }

        // Učitaj statistike pri pokretanju
        loadStats();
    </script>
</body>
</html>