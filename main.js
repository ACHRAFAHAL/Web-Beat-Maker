function el(tag, className, idattr) {
    const HtmlElement = document.createElement(tag);
    HtmlElement.className = className;
    if (idattr) {
        HtmlElement.id = idattr;
    }
    return HtmlElement;
}

function renderGrid(container, cols = 16) { 
    const rows = 8;
    const notenames = ["C3", "B2", "A2", "G2", "F2", "E2", "D2", "C2"];

    const gridlayout = el("div", "grid-layout", "grid-layout-1");
    const labesleftside = el("div", "left-labels-side", "left-labels-side-1");
    const rulerspacer = el("div", "ruler-spacer");
    const rowlabels = el("div", "row-labels");

    // Make row-labels dynamic
    rowlabels.style.display = "grid";
    rowlabels.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    notenames.forEach((notename) => {
        const rowlabel = el("div", "row-label");
        rowlabel.textContent = notename;
        rowlabels.appendChild(rowlabel);
    });

    labesleftside.appendChild(rulerspacer);
    labesleftside.appendChild(rowlabels);

    gridlayout.appendChild(labesleftside);

    const gridlines = el("div", "grid-lines");

    // Create ruler for column numbers
    const ruler = el("div", "ruler");
    ruler.style.display = "grid";
    ruler.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let colindex = 1; colindex <= cols; colindex++) {
        const isbeat = colindex % 4 === 0;
        const rulercell = el("div", `ruler-cell${isbeat ? ' beat' : ''}`);
        rulercell.textContent = colindex;
        ruler.appendChild(rulercell);
    }

    // Create the grid cells container and make it dynamic
    const gridcells = el("div", "grid-cells");
    gridcells.style.display = "grid";
    gridcells.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridcells.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const cellstate = Array.from({ length: rows }, () => Array(cols).fill(false));

    function toggleCell(cell, row, col) {
        const isactive = cellstate[row][col];
        cell.classList.toggle("active", isactive);
    }

    // In your renderGrid function, when creating grid cells:
    for (let rowindex = 0; rowindex < rows; rowindex++) {
        for (let colindex = 0; colindex < cols; colindex++) {
            const gridcell = el("div", "grid-cell");
            gridcell.dataset.row = rowindex;
            gridcell.dataset.col = colindex;

            // Add beat class for every 4th column (1-based: 4, 8, 12, 16, 20...)
            if ((colindex + 1) % 4 === 0) {
                gridcell.classList.add("beat-column");
            }

            gridcells.appendChild(gridcell);

            gridcell.addEventListener("click", () => {
                cellstate[rowindex][colindex] = !cellstate[rowindex][colindex];
                toggleCell(gridcell, rowindex, colindex);
            });
        }
    }

    gridlines.appendChild(ruler);
    gridlines.appendChild(gridcells);
    gridlayout.appendChild(gridlines);
    container.appendChild(gridlayout);

    return {
        cellstate,
        gridcells,
        ruler,
        rows, 
        cols
    }
}

function main() {
    const grid = document.getElementById("grid");
    if (!grid) {
        console.log("grid element missing")
        return;
    }
    const colsSelector = document.getElementById("cols");
    let selectedCols = parseInt(colsSelector?.value) || 16;
    let gridRefs = renderGrid(grid, selectedCols); 

    // Access to controls
    const playbtn = document.getElementById("play")
    const tempo = document.getElementById("tempo")
    const tempoValue = document.getElementById("tempo-value")
    const waveselector = document.getElementById("waveSelect")
    const clearbtn = document.getElementById("clearBtn")
    const randombtn = document.getElementById("randomBtn")


    //playback state mangment 
    let audioContext = null;
    let isPlaying = false 
    let currentColumn = 0 
    let timerId = null;
    const baseFreq = 65.41; // C2 frequency

    function ensureAudioContext(){
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)()
        }
    }

    function getColumnDuration() { 
        const BPM = parseInt(tempo?.value) || 120;
        return 60_000 / BPM / 4;
    }

    function getFreqForRow(row) {
        const semitoneSteps = [12, 11, 9, 7, 5, 4, 2, 0]; // C3, B2, A2, G2, F2, E2, D2, C2
        const step = semitoneSteps[row] || 0;
        // Formula for calculating frequency from a base frequency and semitone steps.
        return baseFreq * Math.pow(2, step / 12);
    }

    function playNoteAt(row, time) {
        const frequency = getFreqForRow(row); 
        const oscillator = audioContext.createOscillator(); // Creates a sound source
        const gainNode = audioContext.createGain(); // Controls the volume

        const waveForm = waveselector?.value || "sine"; 
        oscillator.type = waveForm;

        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.001; 
        oscillator.connect(gainNode).connect(audioContext.destination); 

        // Create a short volume envelope to make the note sound more natural.
        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.linearRampToValueAtTime(0.5, time + 0.01); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        oscillator.start(time);
        oscillator.stop(time + 0.3); 
    }

    function highlight(col, on) {
        const gridcells = gridRefs.gridcells;
        const ruler = gridRefs.ruler;
        const rows = gridRefs.rows; 
        const cols = gridRefs.cols; 
        
        if (!gridcells || !ruler) {
            return; 
        }

        for (let r = 0; r < rows; r++) {
            const cellindex = r * cols + col; 
            const cell = gridcells.children[cellindex];
            if (cell) {
                cell.classList.toggle("highlight", on);
            }
        }
        
        const rulerCell = ruler.children[col];
        if (rulerCell) {
            rulerCell.classList.toggle("highlight", on);
        }

    }

    function playbackStep() {
        if (!isPlaying || !audioContext) return;
        const now = audioContext.currentTime;


        const gridState = gridRefs.cellstate; 

        
        const rows = gridRefs.rows;
        const cols = gridRefs.cols;

        
        for (let r = 0; r < rows; r++) { 
            if (gridState[r][currentColumn]) {
                playNoteAt(r, now);
            }
        }

        
        const prevColumn = (currentColumn - 1 + cols) % cols; 
        highlight(prevColumn, false); 
        
        highlight(currentColumn, true); 

        
        currentColumn = (currentColumn + 1) % cols; // Use cols, not colindex
        
        timerId = setTimeout(playbackStep, getColumnDuration());
    }

    function setControlsDisabled(disabled) {
        [, randombtn].disabled = disabled;
    }
    

    function StartPlayback() {
        ensureAudioContext();
        if (audioContext.state == "suspended") {
            audioContext.resume();
        }
        if (isPlaying) {
            return;
        }

        isPlaying = true;
        playbtn.textContent = "Stop";
        setControlsDisabled(true);
        currentColumn = 0;
        playbackStep();
    }

    function StopPlayback() {
        if (!isPlaying) return;

        isPlaying = false;
        playbtn.textContent = "Play";
        clearTimeout(timerId); // Stop the loop 

        
        const cols = gridRefs.cols;
        for (let c = 0; c < cols; c++) { 
            highlight(c, false);
        }
        setControlsDisabled(false);
    }

    // Add Eventlisteners
    if (tempo && tempoValue) {
        tempo.addEventListener('input', (e) => {
            tempoValue.textContent = e.target.value;
        });
        
        // Also update on change event for better compatibility
        tempo.addEventListener('change', (e) => {
            tempoValue.textContent = e.target.value;
        });
    }

    playbtn.addEventListener("click", ()=>{
        if (isPlaying) {
            StopPlayback();
        } else {
            StartPlayback();
        }
    });

    clearbtn.addEventListener("click", () => {
    const { gridcells, cellstate, rows, cols } = gridRefs; // Destructure all needed values

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellindex = r * cols + c;
            const cell = gridcells.children[cellindex];
            if (cell) {
                cell.classList.remove("active");
                }
            cellstate[r][c] = false;
            }
        }
    });

    randombtn.addEventListener("click", () => {
        const probability = 0.2; // 20% chance for a note to be active
        const { cellstate, gridcells, rows, cols } = gridRefs; // Use correct destructuring

        for (let r = 0; r < rows; r++) { // Use rows instead of ROWS
            for (let c = 0; c < cols; c++) { // Use cols instead of COLS
                const isActive = Math.random() < probability; // Decide if the cell should be active
                cellstate[r][c] = isActive; // Use cellstate instead of gridState
                const cellIndex = r * cols + c; // Use cols instead of COLS
                const cell = gridcells.children[cellIndex]; // Use gridcells instead of gridInner
                if (cell) { // Add safety check
                    cell.classList.toggle("active", isActive); // Update css class
                }
            }
        }
    });

    if (colsSelector) {
        colsSelector.addEventListener("change", () => {
            selectedCols = parseInt(colsSelector.value) || 16;
            grid.innerHTML = "";
            gridRefs = renderGrid(grid, selectedCols); 
        });
    }
}

window.addEventListener("DOMContentLoaded", main); // Ensure the DOM is fully loaded before running main