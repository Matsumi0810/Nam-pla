let isMemoMode = false, lives = 3, selectedCell = null, timerInterval, seconds = 0, currentLevelKey = "0.6", isPaused = false, solution = [];
const boardElement = document.getElementById('board');

function selectLevel(btn, val) {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); currentLevelKey = val;
}

function togglePause() {
    isPaused = !isPaused;
    const overlay = document.getElementById('pause-overlay');
    const board = document.getElementById('board');
    if (isPaused) {
        clearInterval(timerInterval);
        overlay.style.display = 'flex';
        board.classList.add('paused');
    } else {
        startTimer();
        overlay.style.display = 'none';
        board.classList.remove('paused');
    }
}

function showGameOver() {
    clearInterval(timerInterval);
    const overlay = document.getElementById('gameover-overlay');
    const board = document.getElementById('board');
    overlay.style.display = 'flex';
    board.classList.add('paused');
}

function retryGame() {
    document.getElementById('gameover-overlay').style.display = 'none';
    document.getElementById('board').classList.remove('paused');
    initGame();
}

function backToTitle() {
    clearInterval(timerInterval);
    isPaused = false;
    document.querySelectorAll('.overlay').forEach(ov => ov.style.display = 'none');
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    boardElement.innerHTML = '';
    boardElement.classList.remove('paused');
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById('timer-display').textContent =
            `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }, 1000);
}

function generateSudoku() {
    let grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    const isValid = (g, r, c, n) => {
        for (let i = 0; i < 9; i++) if (g[r][i] === n || g[i][c] === n) return false;
        let rr = Math.floor(r / 3) * 3, cc = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[rr + i][cc + j] === n) return false;
        return true;
    };
    const fill = (g) => {
        for (let i = 0; i < 81; i++) {
            let r = Math.floor(i / 9), c = i % 9;
            if (g[r][c] === 0) {
                let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                for (let n of nums) { if (isValid(g, r, c, n)) { g[r][c] = n; if (fill(g)) return true; g[r][c] = 0; } }
                return false;
            }
        } return true;
    };
    fill(grid); return grid;
}

function initGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    lives = 3; seconds = 0; selectedCell = null;
    updateHearts();
    solution = generateSudoku();
    generateBoard(parseFloat(currentLevelKey));
    document.getElementById('timer-display').textContent = "00:00";
    startTimer();
}

function generateBoard(rate) {
    boardElement.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const container = document.createElement('div');
            container.className = 'cell-container';
            if (c === 2 || c === 5) container.classList.add('border-r');
            if (r === 2 || r === 5) container.classList.add('border-b');
            const input = document.createElement('input');
            input.className = 'cell-input'; input.readOnly = true;
            if (Math.random() < rate) { input.value = solution[r][c]; container.classList.add('fixed'); }
            else {
                const mg = document.createElement('div'); mg.className = 'memo-grid';
                for (let i = 1; i <= 9; i++) { const s = document.createElement('span'); s.id = `memo-${r}-${c}-${i}`; mg.appendChild(s); }
                container.appendChild(mg);
            }
            container.addEventListener('click', () => { if (!isPaused && lives > 0) selectCell(container, input, r, c); });
            container.appendChild(input);
            boardElement.appendChild(container);
        }
    }
}

function selectCell(container, input, r, c) {
    if (selectedCell) selectedCell.container.classList.remove('selected');
    selectedCell = { container, input, r, c };
    container.classList.add('selected');
    updateHighlights(input.value);
}

function updateHighlights(num) {
    document.querySelectorAll('.cell-container').forEach(el => el.classList.remove('highlight-number'));
    if (!num) return;
    document.querySelectorAll('.cell-input').forEach(i => { if (i.value == num) i.parentElement.classList.add('highlight-number'); });
}

function pressNumber(num) {
    if (!selectedCell || isPaused || lives <= 0) return;
    const { container, input, r, c } = selectedCell;
    if (container.classList.contains('fixed')) return;
    if (num === 'delete') {
        input.value = ''; container.classList.remove('player', 'error');
        for (let i = 1; i <= 9; i++) {
            const memo = document.getElementById(`memo-${r}-${c}-${i}`);
            if (memo) memo.textContent = '';
        }
        updateHighlights("");
        return;
    }
    if (isMemoMode) {
        const m = document.getElementById(`memo-${r}-${c}-${num}`);
        if (m) m.textContent = m.textContent ? '' : num;
    } else {
        if (num === solution[r][c]) {
            input.value = num; container.classList.add('player'); container.classList.remove('error');
            updateHighlights(num); checkClear();
        } else {
            input.value = num; container.classList.add('error');
            lives--; updateHearts();
            if (lives <= 0) { showGameOver(); }
        }
    }
}

function updateHearts() {
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((h, i) => h.style.opacity = i >= lives ? "0.1" : "1");
}

function setMode(mode) {
    isMemoMode = (mode === 'memo');
    document.getElementById('entry-mode-btn').classList.toggle('active', !isMemoMode);
    document.getElementById('memo-mode-btn').classList.toggle('active', isMemoMode);
}

function checkClear() {
    const inputs = document.querySelectorAll('.cell-input');
    const allFilled = Array.from(inputs).every(i => i.value != '' && !i.parentElement.classList.contains('error'));
    if (allFilled) { clearInterval(timerInterval); alert('クリア！'); backToTitle(); }
}