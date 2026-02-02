let timerInterval = null;
let expectedFinishTime = null;

self.onmessage = function (e) {
    const { command, duration } = e.data;

    if (command === 'start') {
        // Stop any existing timer
        if (timerInterval) clearInterval(timerInterval);

        // Calculate expected finish time based on current time + duration
        // duration is in seconds
        expectedFinishTime = Date.now() + (duration * 1000);

        // Start interval
        timerInterval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.ceil((expectedFinishTime - now) / 1000);

            if (remaining <= 0) {
                // Done
                self.postMessage({ type: 'finish' });
                clearInterval(timerInterval);
                timerInterval = null;
            } else {
                // Tick
                self.postMessage({ type: 'tick', timeLeft: remaining });
            }
        }, 1000);

    } else if (command === 'stop') {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
};
