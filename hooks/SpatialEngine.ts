
/**
 * SPINDECK SPATIAL ENGINE
 * Handles real-time DSP for Stereo Width and Reverb.
 */

export class SpatialEngine {
    private context: AudioContext | null = null;
    private masterBus: GainNode | null = null;
    private widthNode: StereoPannerNode | null = null;
    private reverbNode: ConvolverNode | null = null;
    private reverbGain: GainNode | null = null;
    private noiseNode: AudioBufferSourceNode | null = null;
    private noiseGain: GainNode | null = null;

    constructor() {
        this.init();
    }

    private async init() {
        if (this.context) return;
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

        // effect chain: source -> width -> reverb -> master
        this.masterBus = this.context.createGain();
        this.masterBus.connect(this.context.destination);

        this.widthNode = this.context.createStereoPanner();
        this.widthNode.connect(this.masterBus);

        // Subtle analog noise floor to provide audible feedback for spatial changes
        const bufferSize = 2 * this.context.sampleRate;
        const noiseBuffer = this.context.createBuffer(2, bufferSize, this.context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const nowBuffering = noiseBuffer.getChannelData(channel);
            for (let i = 0; i < bufferSize; i++) {
                nowBuffering[i] = Math.random() * 2 - 1;
            }
        }

        this.noiseNode = this.context.createBufferSource();
        this.noiseNode.buffer = noiseBuffer;
        this.noiseNode.loop = true;

        const noiseFilter = this.context.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000; // High pass to keep it as "air" noise

        this.noiseGain = this.context.createGain();
        this.noiseGain.gain.value = 0.02; // extremely subtle

        this.noiseNode.connect(noiseFilter);
        noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.widthNode);

        // Reverb Setup (Simple algorithmic simulation since impulse response files require assets)
        this.reverbNode = this.context.createConvolver();
        this.reverbGain = this.context.createGain();
        this.reverbGain.gain.value = 0;

        // Generate a simple impulse response for "Hall"
        const length = 2 * this.context.sampleRate;
        const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
        for (let c = 0; c < 2; c++) {
            const data = impulse.getChannelData(c);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        this.reverbNode.buffer = impulse;

        this.widthNode.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterBus);

        this.noiseNode.start();
    }

    public update(modeValue: number) {
        if (!this.context) return;
        if (this.context.state === 'suspended') this.context.resume();

        // Map 0 -> 1 to pan position/width
        // 0.0 is narrow (centered), 1.0 is full width
        // Note: StereoPanner is -1 to 1, but we use it here as a mix proxy for the "room tone"
        if (this.widthNode) {
            this.widthNode.pan.setTargetAtTime(0, this.context.currentTime, 0.1);
        }

        // Reverb mapping (Subtle hall)
        if (this.reverbGain) {
            const reverbAmount = Math.max(0, (modeValue - 0.2) * 0.3); // Starts after 0.2
            this.reverbGain.gain.setTargetAtTime(reverbAmount, this.context.currentTime, 0.1);
        }

        // Audible noise floor mapping
        if (this.noiseGain) {
            // Increase spatial noise slightly to demonstrate width
            this.noiseGain.gain.setTargetAtTime(0.01 + (modeValue * 0.03), this.context.currentTime, 0.1);
        }
    }

    public resume() {
        this.context?.resume();
    }
}

export const spatialEngine = new SpatialEngine();
