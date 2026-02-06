import valentineWeekText from './valentinesweek.txt?raw';

// --- Assets ---
// Glob all GIFs in src/ and src/loading/
const srcGifsGlob = import.meta.glob('/src/*.gif', { eager: true, query: '?url', import: 'default' });
const loadingGifsGlob = import.meta.glob('/src/loading/*.gif', { eager: true, query: '?url', import: 'default' });

const ALL_GIFS = { ...srcGifsGlob, ...loadingGifsGlob };

// Helper to find gif by keyword
const findGif = (keywords) => {
    const keys = Object.keys(ALL_GIFS);
    // Prioritize src/ over loading/ if possible, or just find match
    const match = keys.find(k => keywords.every(kw => k.toLowerCase().includes(kw)));
    return match ? ALL_GIFS[match] : null; // Return URL
};

// Captcha
const captchaGlob = import.meta.glob('/captcha/*.{png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' });
const CAPTCHA_IMAGES = Object.entries(captchaGlob).map(([path, url]) => {
    const name = path.split('/').pop();
    return { name, src: url, isRose: name.toLowerCase().includes('rose') };
});

// Loading GIFs List
const LOADING_GIFS = Object.values(loadingGifsGlob);

// Background
import backgroundImage from '/src/background/Untitled design.png';
const BACKGROUND_IMAGE = backgroundImage;

// --- State ---
const state = {
    username: '',
    loginStep: 0,
};

// --- DOM Elements ---
const dom = {
    app: document.getElementById('app'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingGif: document.getElementById('loading-gif'),
    loginScreen: document.getElementById('login-screen'),
    captchaModal: document.getElementById('captcha-modal'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    usernameInput: document.getElementById('username-input'),
    passBoxes: document.querySelectorAll('.pass-box'),
    loginBtn: document.getElementById('login-btn'),
    captchaGrid: document.getElementById('captcha-grid'),
    captchaVerifyBtn: document.getElementById('captcha-verify-btn'),
    greeting: document.getElementById('greeting'),
    dayTitle: document.getElementById('day-title'),
    dayMessage: document.getElementById('day-message'),
    dayImageContainer: document.getElementById('day-image-container'),
};

// --- Utils ---
const showLoading = (callback) => {
    const randomGif = LOADING_GIFS[Math.floor(Math.random() * LOADING_GIFS.length)];
    dom.loadingGif.src = randomGif;
    dom.loadingOverlay.classList.remove('hidden');
    setTimeout(() => {
        dom.loadingOverlay.classList.add('hidden');
        if (callback) callback();
    }, 2000);
};

const getISTDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 60 * 60000;
    return new Date(utc + istOffset);
};

// --- Login Logic ---
dom.passBoxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
        if (e.target.value.length >= 1) {
            e.target.value = e.target.value.slice(0, 1);
            if (index < 3) dom.passBoxes[index + 1].focus();
        }
    });
    box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            if (e.target.value === '' && index > 0) dom.passBoxes[index - 1].focus();
            else e.target.value = '';
        } else if (e.key === 'Enter') {
            dom.loginBtn.click();
        }
    });
    box.addEventListener('focus', (e) => e.target.select());
});

// Username Enter Key
dom.usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        dom.passBoxes[0].focus();
    }
});

dom.loginBtn.addEventListener('click', () => {
    const username = dom.usernameInput.value.trim();
    const password = Array.from(dom.passBoxes).map(b => b.value).join('');
    if (!username) return alert('Please enter your name!');
    if (password !== '0605') {
        alert('Wrong Password!');
        Array.from(dom.passBoxes).forEach(b => b.value = '');
        dom.passBoxes[0].focus();
        return;
    }
    state.username = username;
    showLoading(() => {
        dom.loginScreen.classList.add('hidden');
        initCaptcha();
    });
});

// --- Captcha Logic ---
let selectedCaptchas = new Set();
let currentCaptchaBatch = [];

const initCaptcha = () => {
    dom.captchaModal.classList.remove('hidden');
    const shuffled = [...CAPTCHA_IMAGES].sort(() => 0.5 - Math.random());
    currentCaptchaBatch = shuffled;
    dom.captchaGrid.innerHTML = '';
    selectedCaptchas.clear();
    currentCaptchaBatch.forEach((img, idx) => {
        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        imgEl.className = 'captcha-item';
        // Random placement styling if needed, but grid handles layout. 
        // Request said: "images must change their position in the captcha grid randomly upon initiated" -> Done by shuffling.
        imgEl.addEventListener('click', () => toggleCaptchaSelection(idx, imgEl));
        dom.captchaGrid.appendChild(imgEl);
    });
};

const toggleCaptchaSelection = (index, el) => {
    if (selectedCaptchas.has(index)) {
        selectedCaptchas.delete(index);
        el.classList.remove('selected');
    } else {
        selectedCaptchas.add(index);
        el.classList.add('selected');
    }
};

dom.captchaVerifyBtn.addEventListener('click', () => {
    const missedRoses = currentCaptchaBatch.some((img, idx) => img.isRose && !selectedCaptchas.has(idx));
    const wrongSelections = Array.from(selectedCaptchas).some(idx => !currentCaptchaBatch[idx].isRose);
    if (missedRoses || wrongSelections) {
        alert('Please select ONLY the roses!');
        initCaptcha();
        return;
    }
    showLoading(() => {
        dom.captchaModal.classList.add('hidden');
        initDashboard();
    });
});

// --- Dashboard Logic (Specific Interaction Flows) ---

const createButton = (text, onClick, id = null) => {
    const btn = document.createElement('button');
    btn.innerText = text;
    if (id) btn.id = id;
    btn.style.padding = '10px 20px';
    btn.style.margin = '10px';
    btn.style.borderRadius = '20px';
    btn.style.border = 'none';
    btn.style.background = '#ff6b81';
    btn.style.color = 'white';
    btn.style.fontSize = '1.1rem';
    btn.style.cursor = 'pointer';
    btn.style.fontFamily = 'var(--font-main)';
    btn.addEventListener('click', onClick);
    return btn;
};

const makeButtonRunAway = (btn) => {
    // Add transition for smooth movement
    btn.style.transition = 'top 0.3s ease, left 0.3s ease';
    // Ensure button is absolute relative to the card, not the window
    btn.style.position = 'absolute';

    const moveBtn = (e) => {
        if (e.type === 'touchstart') e.preventDefault();

        // Get container dimensions (The glass card)
        // btn.offsetParent should be the .glass-card because we added position: relative to it in CSS
        const container = btn.offsetParent || document.body;
        const cWidth = container.clientWidth;
        const cHeight = container.clientHeight;

        // Button dimensions
        const bWidth = btn.clientWidth;
        const bHeight = btn.clientHeight;

        // Calculate safe bounds (stay inside container)
        // We want it to be "bounded inside", so max Left = cWidth - bWidth
        const maxLeft = cWidth - bWidth - 20; // 20px padding
        const maxTop = cHeight - bHeight - 20;
        const minLeft = 20;
        const minTop = 20;

        const newLeft = Math.random() * (maxLeft - minLeft) + minLeft;
        const newTop = Math.random() * (maxTop - minTop) + minTop;

        btn.style.left = `${newLeft}px`;
        btn.style.top = `${newTop}px`;
        // Remove z-index or keep it local
        // btn.style.zIndex = '1000'; // Not needed if inside card usually
    };

    btn.addEventListener('mouseover', moveBtn);
    btn.addEventListener('touchstart', moveBtn);
};

const showFinalResult = (gifUrl, followUpText) => {
    dom.dayImageContainer.innerHTML = '';

    if (gifUrl) {
        const img = document.createElement('img');
        img.src = gifUrl;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '15px';
        img.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        dom.dayImageContainer.appendChild(img);
    }

    if (followUpText) {
        const p = document.createElement('p');
        p.innerText = followUpText;
        p.style.marginTop = '15px';
        p.style.fontSize = '1.3rem';
        p.style.fontWeight = 'bold';
        p.style.color = '#fffbe3';
        dom.dayImageContainer.appendChild(p);
    }
};

const flows = {
    // Feb 7: Rose Day
    '7 Feb': (container) => {
        dom.dayMessage.innerText = "Do you want Roses?";
        const yesBtn = createButton("Yes", () => { }); // Can't press
        makeButtonRunAway(yesBtn);

        const noBtn = createButton("No", () => {
            // Show Loading rose, then Rose gif
            showLoading(() => {
                // Try to match specific 'dudu-love-rose' logic or similar if requested
                // User said: "rose loading gif from src/loading/*rose.gif" and "src/*rose.gif"
                const roseGif = findGif(['dudu-rose']) || findGif(['roseday']) || findGif(['rose']);
                showFinalResult(roseGif, "Come tomorrow for Propose Day!");
                yesBtn.remove();
                noBtn.remove();
            });
        });

        container.appendChild(yesBtn);
        container.appendChild(noBtn);
    },

    // Feb 8: Propose Day
    '8 Feb': (container) => {
        dom.dayMessage.innerText = "Will you be my valentine?";
        const yesBtn = createButton("Yes", () => {
            const gif = findGif(['propose']) || findGif(['bubu', 'dudu']);
            showFinalResult(gif, "Yay! Come tomorrow for Chocolate Day!");
            yesBtn.remove();
            noBtn.remove();
        });
        const noBtn = createButton("No", () => { });
        makeButtonRunAway(noBtn); // No can't be pressed

        container.appendChild(yesBtn);
        container.appendChild(noBtn);
    },

    // Feb 9: Chocolate Day ("Yes" moves, "No" gives chocolate?)
    // Instructions: "yes can't be pressed... pressing no, will prompt the chocolate gif"
    '9 Feb': (container) => {
        dom.dayMessage.innerText = "Do you want a chocolate?";
        const yesBtn = createButton("Yes", () => { });
        makeButtonRunAway(yesBtn); // Yes can't be pressed

        const noBtn = createButton("No", () => {
            const gif = findGif(['chocolate']);
            showFinalResult(gif, "Sweet! Come tomorrow for Teddy Day!");
            yesBtn.remove();
            noBtn.remove();
        });

        container.appendChild(yesBtn);
        container.appendChild(noBtn);
    },

    // Feb 10: Teddy Day (Yes moves)
    '10 Feb': (container) => {
        dom.dayMessage.innerText = "Do you want a teddy?";
        const yesBtn = createButton("Yes", () => { });
        makeButtonRunAway(yesBtn);

        const noBtn = createButton("No", () => {
            const gif = findGif(['teddy']); // bear-panda-chocolate or bubu-dudu-teddy
            showFinalResult(gif, "Cuddles! Come tomorrow for Promise Day!");
            yesBtn.remove();
            noBtn.remove();
        });
        container.appendChild(yesBtn);
        container.appendChild(noBtn);
    },

    // Feb 11: Promise Day
    '11 Feb': (container) => {
        dom.dayMessage.innerText = "I want to promise to you: I will always be there for you.";
        const gif = findGif(['promise']);
        showFinalResult(gif, "Come tomorrow for Hug Day!");
    },

    // Feb 12: Hug Day (Yes moves, No gives hug)
    '12 Feb': (container) => {
        dom.dayMessage.innerText = "Do you want a hug?";
        const yesBtn = createButton("Yes", () => { });
        makeButtonRunAway(yesBtn);

        const noBtn = createButton("No", () => {
            const gif = findGif(['hug']);
            showFinalResult(gif, "Warm hugs! Come tomorrow for Kiss Day!");
            yesBtn.remove();
            noBtn.remove();
        });
        container.appendChild(yesBtn);
        container.appendChild(noBtn);
    },

    // Feb 13: Kiss Day (Yes moves, No gives kiss)
    '13 Feb': (container) => {
        dom.dayMessage.innerText = "Do you want a kiss?";
        const yesBtn = createButton("Yes", () => { });
        makeButtonRunAway(yesBtn);

        const noBtn = createButton("No", () => {
            const gif = findGif(['kiss']);
            showFinalResult(gif, "Mwah! Come tomorrow for Valentine's Day!");
            yesBtn.remove();
            noBtn.remove();
        });
        container.appendChild(yesBtn);
        container.appendChild(noBtn);
    },

    // Feb 14: Valentine (No moves, Yes gives valentine)
    '14 Feb': (container) => {
        dom.dayMessage.innerText = "Do you want to be my valentine?";
        const yesBtn = createButton("Yes", () => {
            const gif = findGif(['valentine']) || findGif(['love']);
            showFinalResult(gif, "Happy Valentine's Day! ❤️");
            yesBtn.remove();
            noBtn.remove();
        });
        const noBtn = createButton("No", () => { });
        makeButtonRunAway(noBtn); // No can't be pressed

        container.appendChild(yesBtn);
        container.appendChild(noBtn);
    }
};

const initDashboard = () => {
    dom.dashboardScreen.classList.remove('hidden');
    document.body.style.backgroundImage = `url('${BACKGROUND_IMAGE}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'fixed';

    dom.greeting.innerText = `Hi ${state.username}`;

    const istDate = getISTDate();
    const day = istDate.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[istDate.getMonth()];

    const dateKey = `${day} ${month}`; // "7 Feb"

    // Parse title mapping just for the Day Name
    const lines = valentineWeekText.split('\n');
    let dayTitle = "Welcome!";
    lines.forEach(l => {
        if (l.startsWith(dateKey)) {
            // "7 Feb (Saturday): Rose Day ..." -> extract "Rose Day"
            // Split by ':' -> "Rose Day - Expression..."
            // Let's simpler parsing: get text between ':' and '-' or just take the whole thing?
            // File: "Feb 7 (Saturday): Rose Day – Expressing..."
            // Wait, my file content is "Feb 7", my key is "7 Feb".
            // Need to match flexible.
        }
    });

    // Better Title Logic
    // File content: "Feb 7 (Saturday): Rose Day – ..."
    // My key: "7 Feb"
    // I need to search for "Feb 7" in the file line.
    const fileLine = lines.find(l => l.includes(`Feb ${day}`));
    if (fileLine) {
        // Extract "Rose Day"
        const parts = fileLine.split(':');
        if (parts[1]) {
            dayTitle = parts[1].split('–')[0].trim();
        }
    }

    dom.dayTitle.innerText = dayTitle !== "Welcome!" ? dayTitle : `Happy ${month}!`;

    // Execute Flow
    dom.dayImageContainer.innerHTML = ''; // clear previous
    if (flows[dateKey]) {
        flows[dateKey](dom.dayImageContainer);
    } else {
        dom.dayMessage.innerText = "It's not Valentine's Week yet, but have a lovely day!";
    }

    createFloatingHearts();
};



// --- Archive Logic ---
const initArchive = () => {
    const listContainer = document.getElementById('archive-list');
    listContainer.innerHTML = '';

    const istDate = getISTDate();
    const currentDayNum = istDate.getDate();
    // Assuming Feb because of context - check month if strictly needed but keep simple
    const isFeb = istDate.getMonth() === 1; // 0-indexed, Feb is 1

    // Parse Text File
    const lines = valentineWeekText.split('\n');
    const validDays = [];

    lines.forEach(line => {
        if (!line.trim().startsWith('Feb')) return;

        // Format: "Feb 7 (Saturday): Rose Day🌹 – ..."
        const dayMatch = line.match(/Feb\s+(\d+)/);
        if (!dayMatch) return;

        const dayNum = parseInt(dayMatch[1]);

        // Condition: Past or Current Day in Feb
        // If not Feb, maybe show all if testing? User requested "expired days' and current day's"
        // Let's assume testing context or strict Feb. Strict:
        if (isFeb && dayNum <= currentDayNum) {
            // Parse Name and Emoji
            const namePart = line.split(':')[1] || "";
            let name = namePart.split('–')[0].trim(); // "Rose Day🌹"

            // Extract Emoji
            const emojiMatch = name.match(/[\u{1F300}-\u{1F9FF}]/u) || line.match(/[\u{1F300}-\u{1F9FF}]/u);
            const emoji = emojiMatch ? emojiMatch[0] : '❤️';

            // Clean Name
            const cleanName = name.replace(emoji, '').trim();

            validDays.push({
                date: `Feb ${dayNum}`,
                name: cleanName,
                emoji: emoji,
                fullLine: line
            });
        }
    });

    if (validDays.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color:#555;">No memories yet! Wait for Valentine\'s Week starts.</p>';
    }

    validDays.forEach(day => {
        const item = document.createElement('div');
        item.className = 'archive-item';
        item.innerHTML = `
            <span>${day.date}</span>
            <span>${day.name}</span>
            <span style="font-size:1.5rem;">${day.emoji}</span>
        `;
        item.addEventListener('click', () => {
            dom.archiveModal.classList.add('hidden');
            const reverseKey = `${day.date.split(' ')[1]} Feb`; // "7 Feb"
            dom.dayTitle.innerText = `${day.name} ${day.emoji}`;
            dom.dayImageContainer.innerHTML = '';
            dom.dayMessage.innerText = ""; // Clear message

            if (flows[reverseKey]) {
                flows[reverseKey](dom.dayImageContainer);
            } else {
                dom.dayMessage.innerText = day.fullLine;
            }
        });
        listContainer.appendChild(item);
    });
};


// Listeners
document.getElementById('archive-btn').addEventListener('click', () => {
    dom.archiveModal.classList.remove('hidden');
    initArchive();
});

document.getElementById('close-archive-btn').addEventListener('click', () => {
    dom.archiveModal.classList.add('hidden');
});

// Update DOM cache logic
dom.archiveModal = document.getElementById('archive-modal');

// Logout Logic
document.getElementById('logout-btn').addEventListener('click', () => {
    state.username = '';
    // Clear passwords
    dom.passBoxes.forEach(b => b.value = '');
    dom.usernameInput.value = '';

    // Hide Dashboard, Show Login
    dom.dashboardScreen.classList.add('hidden');
    dom.loginScreen.classList.remove('hidden');

    // Close Archive if open
    dom.archiveModal.classList.add('hidden');

    // Reset background (optional, but good practice)
    document.body.style.backgroundImage = '';
    document.body.style.background = 'var(--bg-gradient)'; // Reset to CSS default
});
