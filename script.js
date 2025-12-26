/* NurseHub Master Script */

// 1. Search Function: Filters the list as you type
function filterDiseases() {
    const input = document.getElementById('diseaseSearch').value.toUpperCase();
    const loader = document.getElementById('loader');
    const li = document.getElementById('diseaseList').getElementsByTagName('li');

    // Show the loader while typing
    if (input.length > 0) { 
        loader.style.display = "block"; 
    } else { 
        loader.style.display = "none"; 
    }

    // Small delay to make the "Loading" look real
    setTimeout(() => {
        let foundFirst = false;
        for (let i = 0; i < li.length; i++) {
            let text = li[i].textContent || li[i].innerText;
            if (text.toUpperCase().indexOf(input) > -1) {
                li[i].style.display = "";
                
                // If this is the first match and we are searching, scroll to it
                if (!foundFirst && input.length > 2) {
                    li[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    foundFirst = true;
                }
            } else {
                li[i].style.display = "none";
            }
        }
        loader.style.display = "none"; // Hide loader when done
    }, 300);
}

// 2. Alphabet Filter: Shows only diseases starting with a specific letter
function filterByLetter(letter) {
    const li = document.getElementById('diseaseList').getElementsByTagName('li');
    for (let i = 0; i < li.length; i++) {
        const dataLetter = li[i].getAttribute('data-letter');
        li[i].style.display = (dataLetter === letter) ? "" : "none";
    }
}

// 3. Reset Function: Shows all diseases again
function showAll() {
    const li = document.getElementById('diseaseList').getElementsByTagName('li');
    for (let i = 0; i < li.length; i++) { 
        li[i].style.display = ""; 
    }
}

// 4. Page Load: Generate A-Z Buttons
window.onload = function() {
    const alphabetContainer = document.getElementById('alphabetButtons');
    if(alphabetContainer) {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        alphabet.forEach(letter => {
            const btn = document.createElement("button");
            btn.innerHTML = letter;
            btn.onclick = () => filterByLetter(letter);
            alphabetContainer.appendChild(btn);
        });

        const showAllBtn = document.createElement("button");
        showAllBtn.innerHTML = "Show All";
        showAllBtn.onclick = () => showAll();
        showAllBtn.style.background = "var(--primary)";
        showAllBtn.style.color = "white";
        alphabetContainer.appendChild(showAllBtn);
    }
}
window.onload = function() {
    // Array of possible button containers
    const containers = ['alphabetButtons', 'alphabetButtonsBottom'];

    containers.forEach(id => {
        const container = document.getElementById(id);
        if(container) {
            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            alphabet.forEach(letter => {
                const btn = document.createElement("button");
                btn.innerHTML = letter;
                btn.onclick = () => {
                    if (!window.location.pathname.includes("diseases.html")) {
                        window.location.href = `diseases.html?filter=${letter}`;
                    } else {
                        filterByLetter(letter);
                    }
                };
                container.appendChild(btn);
            });

            // "Show All" Button
            const showAllBtn = document.createElement("button");
            showAllBtn.innerHTML = "Show All";
            showAllBtn.onclick = () => {
                if (!window.location.pathname.includes("diseases.html")) {
                    window.location.href = "diseases.html";
                } else {
                    showAll();
                }
            };
            showAllBtn.style.background = "var(--primary)";
            showAllBtn.style.color = "white";
            container.appendChild(showAllBtn);
        }
    });
    
    // Auto-filter if coming from another page
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    if (filter) { filterByLetter(filter); }
};

// Data for the Vital Signs Switcher
const vitalData = {
    fetus: {
        vitals: ["Fetal HR: 110-160 bpm", "Variability: 6-25 bpm", "Movement: 10 kicks/2hr", "Flow: Reactive NST"]
    },
    pediatric: {
        vitals: ["Infant HR: 100-160 bpm", "RR: 30-60/min", "BP: 70-90 systolic", "Temp: 36.5-37.5°C"]
    },
    teen: {
        vitals: ["Teen HR: 60-90 bpm", "RR: 12-16/min", "BP: 110-120 systolic", "Temp: 37.0°C"]
    },
    adult: {
        vitals: ["Adult HR: 60-100 bpm", "RR: 12-20/min", "BP: < 120/80 mmHg", "O2 Sat: 95-100%"]
    },
    pregnant: {
        vitals: ["Preg. HR: +15 bpm shift", "BP: Watch for >140/90", "CO: Increases 30-50%", "O2 Sat: > 95%"]
    }
};

function switchVitals(group, btn) {
    const display = document.getElementById('v-content');
    const data = vitalData[group];
    
    // 1. Remove "active" class from all buttons and add to the clicked one
    document.querySelectorAll('.v-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 2. Clear and rebuild the grid with the new data
    display.innerHTML = data.vitals.map(v => {
        const [label, value] = v.split(':');
        return `<div class="vital-box"><strong>${label}:</strong><br> ${value}</div>`;
    }).join('');
}

// Feedback Toggle Logic
const feedbackBtn = document.getElementById('feedback-btn');
const feedbackCard = document.getElementById('feedback-card');

if (feedbackBtn) {
    feedbackBtn.addEventListener('click', () => {
        if (feedbackCard.style.display === 'none' || feedbackCard.style.display === '') {
            feedbackCard.style.display = 'block';
            feedbackBtn.innerHTML = '✖';
            feedbackBtn.style.backgroundColor = '#ef4444'; // Turns red when open
        } else {
            feedbackCard.style.display = 'none';
            feedbackBtn.innerHTML = '💬';
            feedbackBtn.style.backgroundColor = '#0056b3'; // Returns to medical blue
        }
    });
}

// Close card if clicking outside the container
document.addEventListener('mousedown', (e) => {
    const container = document.getElementById('feedback-container');
    if (container && !container.contains(e.target)) {
        feedbackCard.style.display = 'none';
        feedbackBtn.innerHTML = '💬';
        feedbackBtn.style.backgroundColor = '#0056b3';
    }
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('NurseNexus PWA Registered'))
      .catch(err => console.log('PWA Registration Failed', err));
  });
}
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  
  // Optional: Show a "Install App" button or notification to the user
  console.log('NurseNexus is ready to be installed!');
});

// If you want to trigger the install when they click a specific button:
// document.getElementById('your-install-button').addEventListener('click', (e) => {
//   if (deferredPrompt) {
//     deferredPrompt.prompt();
//     deferredPrompt.userChoice.then((choiceResult) => {
//       if (choiceResult.outcome === 'accepted') {
//         console.log('User accepted the NurseNexus install');
//       }
//       deferredPrompt = null;
//     });
//   }
// });
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved user preference
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-theme');
    themeToggle.innerText = '☀️';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    
    // Save preference and update icon
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerText = isDark ? '☀️' : '🌙';
});