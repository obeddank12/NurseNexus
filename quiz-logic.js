// GLOBAL VARIABLES (Already in your code)
// let currentQuestions = []; etc...

async function finishQuiz() {
    if (quizTimer) clearInterval(quizTimer);
    const percent = Math.round((score / 20) * 100);
    const id = localStorage.getItem('nurse_id');
    const name = localStorage.getItem('nurse_user');

    // 1. RENDER REVIEW UI
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

    // 2. CLOUD SAVE: Sync to Firebase Firestore
    if (isTimedMode && id) {
        try {
            // Save current session score to the leaderboard collection
            await db.collection("leaderboard").add({
                nurseName: name,
                nurseID: id,
                category: currentCat,
                score: score,
                percentage: percent,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update cumulative points in the 'nurses' collection for Grand Master ranking
            const nurseRef = db.collection("nurses").where("nurseID", "==", id).limit(1);
            const nurseSnap = await nurseRef.get();
            if (!nurseSnap.empty) {
                const docId = nurseSnap.docs[0].id;
                await db.collection("nurses").doc(docId).update({
                    totalPoints: firebase.firestore.FieldValue.increment(score)
                });
            }

            console.log("Cloud Sync Successful!");
            displayLeaderboard(); 
        } catch (error) {
            console.error("Cloud Sync Failed: ", error);
        }
    }

    // 3. LOCAL BACKUP
    const localScores = JSON.parse(localStorage.getItem('nurse_high_scores')) || [];
    localScores.push({ name: name, cat: currentCat, percent: percent, mode: isTimedMode ? 'timed' : 'study' });
    localStorage.setItem('nurse_high_scores', JSON.stringify(localScores));
}

async function displayLeaderboard() {
    const catContainer = document.getElementById('aside-leaderboard-content');
    if (!catContainer) return;

    // A. FETCH LIVE CATEGORY LEADERS (Timed Mode Only)
    const categories = ['Med-Surg', 'Obstetrics', 'Paediatrics', 'Public Health', 'Psychiatry', 'Ward-Management'];
    catContainer.innerHTML = '';

    for (let cat of categories) {
        try {
            const snapshot = await db.collection("leaderboard")
                .where("category", "==", cat)
                .orderBy("percentage", "desc")
                .limit(5)
                .get();

            let block = `<div class="cat-leader-block"><strong>${cat}</strong>`;
            if (snapshot.empty) {
                block += `<div class="leader-entry" style="color:#94a3b8; font-style:italic;">No timed records</div>`;
            } else {
                snapshot.docs.forEach((doc, i) => {
                    const data = doc.data();
                    let medal = i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "";
                    block += `<div class="leader-entry"><span>${medal}${data.nurseName}</span><strong>${data.percentage}%</strong></div>`;
                });
            }
            catContainer.innerHTML += block + `</div>`;
        } catch (e) { 
            console.error("Error fetching cat leaders (Check if Index is created):", e); 
        }
    }

    // B. FETCH LIVE GRAND MASTERS
    renderGrandMasters(); 
}

async function renderGrandMasters() {
    const gmContainer = document.getElementById('grand-master-content');
    if (!gmContainer) return;

    try {
        const snapshot = await db.collection("nurses")
            .orderBy("totalPoints", "desc")
            .limit(3)
            .get();

        gmContainer.innerHTML = '';
        const gmMedals = ["👑", "🥈", "🥉"];
        
        snapshot.docs.forEach((doc, i) => {
            const data = doc.data();
            gmContainer.innerHTML += `
                <div class="leader-entry">
                    <span>${gmMedals[i]} ${data.name}</span>
                    <strong>${data.totalPoints} pts</strong>
                </div>`;
        });
    } catch (e) {
        console.error("Error fetching Grand Masters:", e);
    }
}