// Simple audio utility using Web Audio API (no external dependencies)
class GameAudio {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;
    private lastPlayTime: { [key: string]: number } = {};
    private cooldownMs: number = 100; // Prevent rapid-fire sounds

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    private canPlay(soundName: string): boolean {
        const now = Date.now();
        const lastPlay = this.lastPlayTime[soundName] || 0;
        if (now - lastPlay < this.cooldownMs) {
            return false;
        }
        this.lastPlayTime[soundName] = now;
        return true;
    }

    // Balloon pop sound (short, high-pitched)
    playPop() {
        if (!this.enabled || !this.audioContext || !this.canPlay('pop')) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);

        // Cleanup
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, 200);
    }

    // Achievement unlock sound (triumphant)
    playAchievement() {
        if (!this.enabled || !this.audioContext || !this.canPlay('achievement')) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);

        // Cleanup
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, 500);
    }

    // Success sound (positive feedback)
    playSuccess() {
        if (!this.enabled || !this.audioContext || !this.canPlay('success')) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);

        // Cleanup
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, 250);
    }
}

export const gameAudio = new GameAudio();
