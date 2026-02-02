class CatodoroTimer {
    constructor() {
        this.timeRemaining = 25 * 60; // default 25 minutes
        this.isRunning = false;

        // Web Worker (Inlined to work with file:// protocol)
        const workerCode = `
            let timerInterval = null;
            let expectedFinishTime = null;

            self.onmessage = function(e) {
                const { command, duration } = e.data;

                if (command === 'start') {
                    if (timerInterval) clearInterval(timerInterval);
                    expectedFinishTime = Date.now() + (duration * 1000);
                    
                    timerInterval = setInterval(() => {
                        const now = Date.now();
                        const remaining = Math.ceil((expectedFinishTime - now) / 1000);

                        if (remaining <= 0) {
                            self.postMessage({ type: 'finish' });
                            clearInterval(timerInterval);
                            timerInterval = null; 
                        } else {
                            self.postMessage({ type: 'tick', timeLeft: remaining });
                        }
                    }, 250);
                } else if (command === 'stop') {
                    if (timerInterval) clearInterval(timerInterval);
                }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.timerWorker = new Worker(URL.createObjectURL(blob));

        // DOM Elements
        this.timerDisplay = document.getElementById('timer-display');
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.customDurationInput = document.getElementById('custom-duration');
        this.setDurationBtn = document.getElementById('set-duration-btn');
        this.mascot = document.getElementById('mascot');
        this.audioPlayer = document.getElementById('meow-player');

        // Bind events
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.setDurationBtn.addEventListener('click', () => this.setCustomDuration());

        // Worker Listener
        this.timerWorker.onmessage = (e) => {
            const { type, timeLeft } = e.data;
            if (type === 'tick') {
                this.timeRemaining = timeLeft;
                this.updateDisplay();
            } else if (type === 'finish') {
                this.finish();
            }
        };

        this.updateDisplay();

        // Request Notification permission if possible
        if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.startBtn.textContent = "Focusing...";
        document.body.classList.add('timer-running');

        // Send start command to worker with current remaining time in seconds
        this.timerWorker.postMessage({ command: 'start', duration: this.timeRemaining });
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.startBtn.textContent = "Resume Meow";
        document.body.classList.remove('timer-running');

        this.timerWorker.postMessage({ command: 'stop' });
    }

    reset() {
        this.stop();
        // Reset to whatever the input duration is, or default 25
        const minutes = parseInt(this.customDurationInput.value) || 25;
        this.timeRemaining = minutes * 60;
        this.startBtn.textContent = "Start Meow";
        this.updateDisplay();
    }

    setCustomDuration() {
        const minutes = parseInt(this.customDurationInput.value);
        if (minutes && minutes > 0) {
            this.stop();
            this.timeRemaining = minutes * 60;
            this.updateDisplay();
            this.startBtn.textContent = "Start Meow";
        } else {
            alert("Please enter a valid number of minutes!");
        }
    }

    updateDisplay() {
        // Prevent negative time display just in case
        const safeTime = Math.max(0, this.timeRemaining);
        const minutes = Math.floor(safeTime / 60);
        const seconds = safeTime % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update Title
        document.title = `${this.timerDisplay.textContent} - Catodoro`;
    }

    finish() {
        this.stop();
        this.timerDisplay.textContent = "00:00";
        document.title = "Done! - Catodoro";
        this.startBtn.textContent = "Start Meow";

        // Mascot celebration animation
        this.mascot.style.transform = "scale(1.2) rotate(360deg)";
        setTimeout(() => {
            this.mascot.style.transform = "none";
        }, 1000);

        // Show Notification if permitted
        if (Notification.permission === "granted") {
            new Notification("Meow! Focus session complete!");
        }

        // Wait for sound to finish before alerting
        const onSoundEnded = () => {
            alert("Meow! Focus session complete!");
            this.audioPlayer.removeEventListener('ended', onSoundEnded);
        };

        // Add listener then play
        this.audioPlayer.addEventListener('ended', onSoundEnded);
        this.playRandomMeow();
    }

    playRandomMeow() {
        // Requirement: Random sound from 1-25
        const randomIndex = Math.floor(Math.random() * 25) + 1;
        const soundPath = `assets/sounds/meow_${randomIndex}.wav`;

        console.log(`Attempting to play: ${soundPath}`);

        // files are meow_1.wav through meow_25.wav
        this.audioPlayer.src = soundPath;
        this.audioPlayer.play().catch(e => {
            console.warn("Could not play sound (might be missing file or interaction policy):", e);
            // Fallback if meow_1 is the only one guaranteed to exist
            if (randomIndex !== 1) {
                this.audioPlayer.src = `assets/sounds/meow_1.wav`;
                this.audioPlayer.play().catch(err => console.error("Fallback failed", err));
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const timer = new CatodoroTimer();
});
