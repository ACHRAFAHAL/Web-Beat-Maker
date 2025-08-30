# Web Beat Maker

A small browser-based step sequencer / song maker. Click grid cells to toggle notes, set tempo and waveform, then press Play.
Live demo: [Click Here]([index.html](https://achrafahal.github.io/Web-Beat-Maker/))


Controls
- Play / Stop: toggles playback.
- Tempo slider (id: tempo): BPM for playback.
- Sound (id: waveSelect): choose oscillator type (sine, square, triangle, sawtooth).
- Span (id: cols): set number of columns (16, 20, 24, 28).
- Clear: clears all active notes.
- Randomise: fills the grid with a random pattern.

How it works (key code locations)
- UI/grid rendering: [`renderGrid`](main.js)
- App bootstrap / wiring: [`main`](main.js)
- DOM helper: [`el`](main.js)
- Audio scheduling / playback step: [`playNoteAt`](main.js)
- Frequency mapping: [`getFreqForRow`](main.js)
- Timing: [`getColumnDuration`](main.js)

Notes
- Uses the Web Audio API (AudioContext). User gesture may be required to start audio on some browsers.
- Grid is 8 rows by N columns (configurable via the Span selector). Row note names are rendered in the UI.
- Styling in [style.css](style.css).
