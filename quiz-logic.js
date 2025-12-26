// quiz-logic.js - The Brain of NurseNexus Quiz
let currentSet = [];
let currentIndex = 0;
let score = 0;
let currentCategory = ""; // Tracks category for the leaderboard

// NEW: Initialize high scores from storage
let highScores = JSON.parse(localStorage.getItem('nurse_high_scores')) || [];

function startQuiz(category, setNum) {
    currentCategory = category; // Save the category
    const setName = "Set " + setNum;
    if (quizData[category] && quizData[category][setName]) {
        currentSet = quizData[category][setName];
        currentIndex = 0;
        score = 0;
        
        // Switch UI
        document.getElementById('set-stage').style.display = 'none';
        document.getElementById('quiz-stage').style.display = 'block';
        
        showQuestion();
    } else {
        alert("This set is being verified. Obed is finalizing the questions!");
    }
}

function showQuestion() {
    const q = currentSet[currentIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('question-count').innerText = `Question ${currentIndex + 1} of ${currentSet.length}`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(btn, opt, q.answer);
        optionsContainer.appendChild(btn);
    });

    const progress = ((currentIndex + 1) / currentSet.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

function checkAnswer(btn, selected, correct) {
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (selected === correct) {
        btn.classList.add('correct');
        score++;
    } else {
        btn.classList.add('wrong');
        allBtns.forEach(b => {
            if(b.innerText === correct) b.classList.add('correct');
        });
    }
    document.getElementById('next-btn').style.display = 'block';
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentSet.length) {
        document.getElementById('next-btn').style.display = 'none';
        showQuestion();
    } else {
        showResults();
    }
}

// UPDATED: Now saves to Leaderboard
function showResults() {
    const user = localStorage.getItem('nurse_user') || "Nurse";
    const percentage = Math.round((score / currentSet.length) * 100);
    
    // Save to High Scores
    saveToLeaderboard(user, currentCategory, percentage);

    document.getElementById('quiz-stage').innerHTML = `
        <div class="card" style="text-align:center; animation: fadeIn 0.5s;">
            <div style="font-size: 50px; margin-bottom: 10px;">${percentage >= 70 ? '🎉' : '📚'}</div>
            <h2>Quiz Complete!</h2>
            <p class="score-display" style="font-size: 1.5rem; color: var(--primary);">
                ${user}, you scored ${score}/${currentSet.length} (${percentage}%)
            </p>
            <p style="margin: 15px 0; color: #64748b;">
                ${percentage >= 75 ? "Excellent! Your name has been updated on the leaderboard." : "Good effort! Keep practicing to master the Erasmus Series."}
            </p>
            <button onclick="location.reload()" class="v-btn active" style="width:100%; margin-top:10px;">Back to Menu</button>
        </div>
    `;
}

// NEW: Helper function for Leaderboard
function saveToLeaderboard(name, category, percent) {
    let scores = JSON.parse(localStorage.getItem('nurse_high_scores')) || [];
    const newEntry = { name, cat: category, percent, date: new Date().toLocaleDateString() };
    
    scores.push(newEntry);
    // Sort: Highest percentage first
    scores.sort((a, b) => b.percent - a.percent);
    // Keep top 10
    scores = scores.slice(0, 10);
    
    localStorage.setItem('nurse_high_scores', JSON.stringify(scores));
}

// NEW: Global Reset Function
function resetAllProgress() {
    if(confirm("DANGER: This will delete your High Scores and logged-in name. Proceed?")) {
        localStorage.clear();
        location.reload();
    }
}