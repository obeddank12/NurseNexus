let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let selectedOption = null;
let userName = "";
let currentCat = "";
let wrongQuestions = [];
let quizTimer;
let timeLeft;
let isTimedMode = false;
let currentSetNum = 0;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startQuiz(category, setNum) {
    currentCat = category;
    currentSetNum = setNum;
    document.getElementById('mode-modal').style.display = 'block';
}

function confirmMode(mode) {
    document.getElementById('mode-modal').style.display = 'none';
    isTimedMode = (mode === 'timed');
    userName = localStorage.getItem('nurse_user') || "Nurse";
    const rawQuestions = quizData[currentCat][`Set ${currentSetNum}`];
    
    if (!rawQuestions) return;

    currentQuestions = shuffleArray([...rawQuestions]);
    currentQuestions.forEach(q => {
        q.options = shuffleArray([...q.options]);
    });

    currentIndex = 0;
    score = 0;
    wrongQuestions = [];
    
    document.getElementById('set-stage').style.display = 'none';
    document.getElementById('quiz-stage').style.display = 'block';

    if (isTimedMode) {
        startTimer(1200); 
    } else {
        document.getElementById('timer-display').innerText = "📖 Study Mode";
    }
    showQuestion();
}

function startTimer(seconds) {
    timeLeft = seconds;
    updateTimerUI();
    quizTimer = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            alert("Time is up! Submitting your answers automatically.");
            finishQuiz();
        }
    }, 1000);
}

function updateTimerUI() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const display = document.getElementById('timer-display');
    if(!display) return;
    display.innerText = `⏱️ ${mins}:${secs < 10 ? '0' : ''}${secs}`;
    if (timeLeft <= 120) {
        display.style.color = "#dc2626"; 
        display.style.fontWeight = "bold";
    } else {
        display.style.color = "var(--primary)";
    }
}

function showQuestion() {
    const q = currentQuestions[currentIndex];
    selectedOption = null;
    document.getElementById('question-count').innerText = `Question ${currentIndex + 1} of 20 | Score: ${score}`;
    document.getElementById('progress-fill').style.width = `${((currentIndex + 1) / 20) * 100}%`;
    document.getElementById('question-text').innerText = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectOption(btn, opt);
        container.appendChild(btn);
    });
    document.getElementById('next-btn').style.display = 'none';
}

function selectOption(btn, opt) {
    document.querySelectorAll('.option-btn').forEach(b => {
        b.style.borderColor = '#ddd';
        b.style.background = 'white';
    });
    btn.style.borderColor = 'var(--primary)';
    btn.style.background = '#f0f9ff';
    selectedOption = opt;
    const nextBtn = document.getElementById('next-btn');
    nextBtn.innerText = "Confirm Answer";
    nextBtn.style.display = 'block';
    nextBtn.onclick = confirmAnswer; 
}

function confirmAnswer() {
    const q = currentQuestions[currentIndex];
    const buttons = document.querySelectorAll('.option-btn');
    let correctBtn, userBtn;
    buttons.forEach(btn => {
        if (btn.innerText === q.answer) correctBtn = btn;
        if (btn.innerText === selectedOption) userBtn = btn;
        btn.disabled = true;
    });
    if (selectedOption === q.answer) {
        userBtn.classList.add('correct');
        score++;
    } else {
        userBtn.classList.add('wrong');
        correctBtn.classList.add('correct');
        wrongQuestions.push({ q: q.question, yourAns: selectedOption, correctAns: q.answer });
    }
    document.getElementById('question-count').innerText = `Question ${currentIndex + 1} of 20 | Score: ${score}`;
    const nextBtn = document.getElementById('next-btn');
    nextBtn.innerText = (currentIndex === 19) ? (isTimedMode ? "Submit Exam" : "Finish & Review") : "Next Question";
    nextBtn.onclick = nextQuestion;
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < 20) { showQuestion(); } else { finishQuiz(); }
}

function finishQuiz() {
    if (quizTimer) clearInterval(quizTimer);
    const percent = Math.round((score / 20) * 100);
    
    let reviewHTML = `<h3>Results: ${score}/20 (${percent}%)</h3>`;
    if (wrongQuestions.length > 0) {
        reviewHTML += `<p style="color:var(--emergency)">Mistakes recorded:</p>`;
        wrongQuestions.forEach(item => {
            reviewHTML += `<div style="text-align:left; font-size:0.85rem; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <strong>Q:</strong> ${item.q}<br>
                <span style="color:red">✘ ${item.yourAns}</span> | <span style="color:green">✔ ${item.correctAns}</span>
            </div>`;
        });
    } else {
        reviewHTML += `<p style="color:green">🏆 Perfect Score!</p>`;
    }
    
    document.getElementById('quiz-stage').innerHTML = reviewHTML + `<button onclick="location.reload()" class="v-btn active" style="width:100%; margin-top:20px;">Return to Dashboard</button>`;
    
    // SAVE LOGIC: Only save Timed Mode for Leaderboards
    if (isTimedMode) {
        const scores = JSON.parse(localStorage.getItem('nurse_high_scores')) || [];
        scores.push({ 
            name: userName, 
            cat: currentCat, 
            percent: percent, 
            points: score, // Raw correct answers
            mode: 'timed' 
        });
        localStorage.setItem('nurse_high_scores', JSON.stringify(scores));
    }
}

function displayLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('nurse_high_scores')) || [];

    // 1. GRAND MASTER CALCULATION (Total Points from ALL categories)
    const userTotals = {};
    scores.forEach(s => {
        if (!userTotals[s.name]) userTotals[s.name] = 0;
        userTotals[s.name] += s.points || 0;
    });

    const grandMasters = Object.keys(userTotals)
        .map(name => ({ name: name, total: userTotals[name] }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

    const gmContainer = document.getElementById('grand-master-content');
    if (gmContainer) {
        gmContainer.innerHTML = '';
        const gmMedals = ["👑", "🥈", "🥉"];
        grandMasters.forEach((m, i) => {
            gmContainer.innerHTML += `<div class="leader-entry"><span>${gmMedals[i]} ${m.name}</span><strong>${m.total} pts</strong></div>`;
        });
    }

    // 2. CATEGORY LEADERS (Timed Mode Only)
    const catContainer = document.getElementById('aside-leaderboard-content');
    if (!catContainer) return;
    catContainer.innerHTML = '';

    const categories = ['Med-Surg', 'Obstetrics', 'Paediatrics', 'Public Health', 'Psychiatry', 'Ward-Management'];
    categories.forEach(cat => {
        const catScores = scores
            .filter(s => s.cat === cat && s.mode === 'timed')
            .sort((a, b) => b.percent - a.percent)
            .slice(0, 5);

        let block = `<div class="cat-leader-block"><strong>${cat}</strong>`;
        if (catScores.length === 0) {
            block += `<div class="leader-entry" style="color:#94a3b8; font-style:italic;">No records yet</div>`;
        } else {
            catScores.forEach((s, i) => {
                let medal = i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "";
                block += `<div class="leader-entry"><span>${medal}${s.name}</span><strong>${s.percent}%</strong></div>`;
            });
        }
        catContainer.innerHTML += block + `</div>`;
    });
}