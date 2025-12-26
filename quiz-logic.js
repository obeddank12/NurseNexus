// 1. GLOBAL VARIABLES
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let quizTimer;
let timeLeft = 1200; // 20 minutes
let isTimedMode = false;
let currentCat = "";
let wrongQuestions = [];

// 2. START THE QUIZ
function startQuiz(category, setNumber) {
    if (typeof quizData === 'undefined') return alert("Data still loading...");
    currentCat = category;
    const allSetQuestions = quizData[category][setNumber];
    currentQuestions = [...allSetQuestions].sort(() => 0.5 - Math.random());
    currentQuestionIndex = 0;
    score = 0;
    wrongQuestions = [];
    document.getElementById('set-stage').style.display = 'none';
    document.getElementById('quiz-stage').style.display = 'block';
    if (isTimedMode) startTimer();
    showQuestion();
}

// 3. DISPLAY QUESTION
function showQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('question-count').innerText = `Question ${currentQuestionIndex + 1} of 20`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, q.answer, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selected, correct, btn) {
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => b.disabled = true);

    if (selected === correct) {
        btn.classList.add('correct');
        score++;
    } else {
        btn.classList.add('wrong');
        wrongQuestions.push({ q: currentQuestions[currentQuestionIndex].question, yourAns: selected, correctAns: correct });
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < 20) {
            showQuestion();
        } else {
            finishQuiz();
        }
    }, 1000);
}

// 4. TIMER LOGIC
function startTimer() {
    timeLeft = 1200;
    quizTimer = setInterval(() => {
        timeLeft--;
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        document.getElementById('timer-display').innerText = `⏱️ ${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (timeLeft <= 0) finishQuiz();
    }, 1000);
}

// 5. FINISH & CLOUD SYNC (Your existing code)
async function finishQuiz() {
    if (quizTimer) clearInterval(quizTimer);
    const percent = Math.round((score / 20) * 100);
    const id = localStorage.getItem('nurse_id');
    const name = localStorage.getItem('nurse_user');

    let reviewHTML = `<h3>Results: ${score}/20 (${percent}%)</h3>`;
    if (wrongQuestions.length > 0) {
        reviewHTML += `<p style="color:red">Mistakes recorded:</p>`;
        wrongQuestions.forEach(item => {
            reviewHTML += `<div style="text-align:left; border-bottom:1px solid #eee; padding:5px;">
                <strong>Q:</strong> ${item.q}<br>
                <span style="color:red">✘ ${item.yourAns}</span> | <span style="color:green">✔ ${item.correctAns}</span>
            </div>`;
        });
    }
    document.getElementById('quiz-stage').innerHTML = reviewHTML + `<button onclick="location.reload()" class="v-btn active" style="width:100%; margin-top:20px;">Return to Dashboard</button>`;

    if (isTimedMode && id) {
        try {
            await db.collection("leaderboard").add({
                nurseName: name, nurseID: id, category: currentCat, score: score,
                percentage: percent, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Cloud Sync Successful!");
            displayLeaderboard(); 
        } catch (error) { console.error("Cloud Sync Failed", error); }
    }
}

// 6. LEADERBOARD LOGIC (Your existing code)
async function displayLeaderboard() {
    // ... [Rest of your displayLeaderboard and renderGrandMasters code here] ...
}