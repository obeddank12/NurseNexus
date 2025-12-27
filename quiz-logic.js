// 1. GLOBAL VARIABLES
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let quizTimer;
let timeLeft = 1200; // 20 minutes
let isTimedMode = false;
let currentCat = "";
let wrongQuestions = [];
let selectedOption = null; 

// 2. START THE QUIZ
function startQuiz(category, setNumber) {
    if (typeof quizData === 'undefined') return alert("Data still loading...");
    
    currentCat = category;
    const allSetQuestions = quizData[category][setNumber];
    
    if (!allSetQuestions) return alert("Error: Set questions not found.");

    currentQuestions = [...allSetQuestions].sort(() => 0.5 - Math.random());
    currentQuestionIndex = 0;
    score = 0;
    wrongQuestions = [];
    
    // Reset Live Score Display
    const scoreDisplay = document.getElementById('live-score-display');
    if(scoreDisplay) scoreDisplay.innerText = `Score: 0/20`;

    document.getElementById('set-stage').style.display = 'none';
    document.getElementById('quiz-stage').style.display = 'block';
    
    if (isTimedMode) startTimer();
    showQuestion();
}

// 3. DISPLAY QUESTION
function showQuestion() {
    selectedOption = null; 
    const confirmBtn = document.getElementById('confirm-btn');
    if(confirmBtn) {
        confirmBtn.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.innerText = "Confirm Answer";
    }
    
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('question-count').innerText = `Question ${currentQuestionIndex + 1} of 20`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        
        btn.onclick = () => {
            // Only allow selection if confirm hasn't been clicked
            if (confirmBtn && confirmBtn.innerText === "Confirm Answer") {
                document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedOption = opt;
                confirmBtn.style.display = 'block';
            }
        };
        optionsContainer.appendChild(btn);
    });

    const progress = (currentQuestionIndex / 20) * 100;
    const progressFill = document.getElementById('progress-fill');
    if(progressFill) progressFill.style.width = progress + '%';
}

// 4. CONFIRM & INSTANT FEEDBACK
function confirmAnswer() {
    if (!selectedOption) return;

    const q = currentQuestions[currentQuestionIndex];
    const confirmBtn = document.getElementById('confirm-btn');
    const allBtns = document.querySelectorAll('.option-btn');
    const selectedBtn = Array.from(allBtns).find(b => b.innerText === selectedOption);

    // Disable buttons so they can't click during feedback
    confirmBtn.disabled = true;
    allBtns.forEach(b => b.style.pointerEvents = 'none');

    if (selectedOption === q.answer) {
        score++;
        selectedBtn.classList.add('correct'); // Turns Green
        if(document.getElementById('live-score-display')) {
            document.getElementById('live-score-display').innerText = `Score: ${score}/20`;
        }
    } else {
        selectedBtn.classList.add('wrong'); // Turns Red
        // Also highlight the correct one so they learn
        const correctBtn = Array.from(allBtns).find(b => b.innerText === q.answer);
        if(correctBtn) correctBtn.classList.add('correct');
        
        wrongQuestions.push({ 
            q: q.question, 
            yourAns: selectedOption, 
            correctAns: q.answer 
        });
    }

    // 1 Second Delay so they can see the result
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < 20) {
            showQuestion();
        } else {
            finishQuiz();
        }
    }, 1200);
}

// 5. TIMER LOGIC
function startTimer() {
    timeLeft = 1200;
    quizTimer = setInterval(() => {
        timeLeft--;
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        const timerDisplay = document.getElementById('timer-display');
        if(timerDisplay) timerDisplay.innerText = `⏱️ ${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (timeLeft <= 0) finishQuiz();
    }, 1000);
}

// 6. FINISH & CLOUD SYNC
async function finishQuiz() {
    if (quizTimer) clearInterval(quizTimer);
    const percent = Math.round((score / 20) * 100);
    const id = localStorage.getItem('nurse_id');
    const name = localStorage.getItem('nurse_user');

    let reviewHTML = `<h2>Session Complete!</h2>`;
    reviewHTML += `<div class="card" style="background:var(--primary); color:white; text-align:center; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <p style="font-size:1.8rem; margin:0; font-weight: bold;">${score}/20</p>
                        <p style="margin:0;">Final Score: ${percent}%</p>
                   </div>`;

    if (wrongQuestions.length > 0) {
        reviewHTML += `<h3 style="margin-top:20px; color:var(--emergency); border-bottom: 2px solid #eee; padding-bottom: 10px;">Clinical Mistake Review:</h3>`;
        wrongQuestions.forEach(item => {
            reviewHTML += `<div style="text-align:left; border-bottom:1px solid #eee; padding:15px; margin-bottom:10px; background:#fff; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e293b;">Q: ${item.q}</p>
                <p style="margin: 5px 0; color: #ef4444; font-size: 0.9rem;">✘ Your Choice: ${item.yourAns}</p>
                <p style="margin: 5px 0; color: #10b981; font-size: 0.9rem; font-weight: bold;">✔ Correct Answer: ${item.correctAns}</p>
            </div>`;
        });
    } else {
        reviewHTML += `<div style="padding: 30px; text-align: center;">
                        <p style="color:#10b981; font-weight:bold; font-size:1.5rem;">🏆 Perfect Score! 🏆</p>
                      </div>`;
    }

    document.getElementById('quiz-stage').innerHTML = reviewHTML + 
    `<button onclick="location.reload()" class="v-btn active" style="width:100%; margin-top:20px;">Return to Dashboard</button>`;

    if (isTimedMode && id) {
        try {
            await db.collection("leaderboard").add({
                nurseName: name, nurseID: id, category: currentCat, score: score,
                percentage: percent, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            const nurseRef = db.collection("nurses").where("nurseID", "==", id).limit(1);
            const nurseSnap = await nurseRef.get();
            if (!nurseSnap.empty) {
                await db.collection("nurses").doc(nurseSnap.docs[0].id).update({
                    totalPoints: firebase.firestore.FieldValue.increment(score)
                });
            }
            displayLeaderboard(); 
        } catch (error) { console.error("Cloud Sync Failed", error); }
    }
}

// 7. LEADERBOARD LOGIC
async function displayLeaderboard() {
    const catContainer = document.getElementById('aside-leaderboard-content');
    if (!catContainer) return;

    const categories = ['Med-Surg', 'Obstetrics', 'Paediatrics', 'Public Health', 'Psychiatry', 'Ward-Management'];
    catContainer.innerHTML = '<p style="text-align:center; font-size:0.8rem; color:#64748b;">🔄 Syncing Leaders...</p>';

    let leaderboardHTML = "";

    for (let cat of categories) {
        try {
            const snapshot = await db.collection("leaderboard")
                .where("category", "==", cat)
                .orderBy("percentage", "desc")
                .limit(5)
                .get();

            leaderboardHTML += `<div class="cat-leader-block"><strong>${cat}</strong>`;
            if (snapshot.empty) {
                leaderboardHTML += `<div class="leader-entry" style="color:#94a3b8; font-style:italic;">No records</div>`;
            } else {
                snapshot.docs.forEach((doc, i) => {
                    const data = doc.data();
                    let medal = i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "";
                    leaderboardHTML += `<div class="leader-entry"><span>${medal}${data.nurseName}</span><strong>${data.percentage}%</strong></div>`;
                });
            }
            leaderboardHTML += `</div>`;
        } catch (e) { console.error(e); }
    }
    catContainer.innerHTML = leaderboardHTML;
    renderGrandMasters();
}

async function renderGrandMasters() {
    const gmContainer = document.getElementById('grand-master-content');
    if (!gmContainer) return;
    try {
        const snapshot = await db.collection("nurses").orderBy("totalPoints", "desc").limit(3).get();
        gmContainer.innerHTML = '';
        const gmMedals = ["👑", "🥈", "🥉"];
        snapshot.docs.forEach((doc, i) => {
            const data = doc.data();
            gmContainer.innerHTML += `<div class="leader-entry"><span>${gmMedals[i]} ${data.name}</span><strong>${data.totalPoints} pts</strong></div>`;
        });
    } catch (e) { console.error(e); }
}