let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let selectedOption = null;
let userName = "";
let currentCat = "";
let wrongQuestions = []; // Tracks mistakes for Review Mode

function startQuiz(category, setNum) {
    userName = localStorage.getItem('nurse_user') || "Nurse";
    currentCat = category;
    const questions = quizData[category][`Set ${setNum}`];
    
    if (!questions) return;

    currentQuestions = [...questions];
    currentIndex = 0;
    score = 0;
    wrongQuestions = [];
    
    document.getElementById('set-stage').style.display = 'none';
    document.getElementById('quiz-stage').style.display = 'block';
    showQuestion();
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
    document.querySelectorAll('.option-btn').forEach(b => b.style.borderColor = '#ddd');
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
        // Record the mistake
        wrongQuestions.push({
            q: q.question,
            yourAns: selectedOption,
            correctAns: q.answer
        });
    }

    document.getElementById('question-count').innerText = `Question ${currentIndex + 1} of 20 | Score: ${score}`;
    const nextBtn = document.getElementById('next-btn');
    nextBtn.innerText = (currentIndex === 19) ? "Finish & Review" : "Next Question";
    nextBtn.onclick = nextQuestion;
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < 20) {
        showQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    const percent = Math.round((score / 20) * 100);
    
    // Create Review Summary
    let reviewHTML = `<h3>Results: ${score}/20 (${percent}%)</h3>`;
    if (wrongQuestions.length > 0) {
        reviewHTML += `<p style="color:var(--emergency)">Review your mistakes:</p>`;
        wrongQuestions.forEach(item => {
            reviewHTML += `<div style="text-align:left; font-size:0.85rem; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <strong>Q:</strong> ${item.q}<br>
                <span style="color:red">✘ You: ${item.yourAns}</span> | <span style="color:green">✔ Correct: ${item.correctAns}</span>
            </div>`;
        });
    } else {
        reviewHTML += `<p style="color:green">Perfect Score! Clinical Excellence achieved.</p>`;
    }
    
    document.getElementById('quiz-stage').innerHTML = reviewHTML + `<button onclick="location.reload()" class="v-btn active" style="width:100%; margin-top:20px;">Return to Dashboard</button>`;
    
    // Save to Leaderboard
    const scores = JSON.parse(localStorage.getItem('nurse_high_scores')) || [];
    scores.push({ name: userName, cat: currentCat, percent: percent });
    localStorage.setItem('nurse_high_scores', JSON.stringify(scores));
}