// @ts-nocheck
var audioCtx = null;
function getAudioContext() {
	if (typeof window === "undefined") return null;
	if (!audioCtx) {
		const Ctx = window.AudioContext || window.webkitAudioContext;
		if (Ctx) audioCtx = new Ctx();
	}
	if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
	return audioCtx;
}
function playEnvelopeArrivalSound() {
	const ctx = getAudioContext();
	if (!ctx) return;
	const now = ctx.currentTime;
	const bufferSize = Math.floor(ctx.sampleRate * .45);
	const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	const output = noiseBuffer.getChannelData(0);
	for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
	const whiteNoise = ctx.createBufferSource();
	whiteNoise.buffer = noiseBuffer;
	const bandpass = ctx.createBiquadFilter();
	bandpass.type = "bandpass";
	bandpass.frequency.setValueAtTime(280, now);
	bandpass.frequency.exponentialRampToValueAtTime(1400, now + .22);
	bandpass.frequency.exponentialRampToValueAtTime(420, now + .44);
	bandpass.Q.value = 2.4;
	const whooshGain = ctx.createGain();
	whooshGain.gain.setValueAtTime(.001, now);
	whooshGain.gain.linearRampToValueAtTime(.14, now + .16);
	whooshGain.gain.exponentialRampToValueAtTime(.001, now + .44);
	whiteNoise.connect(bandpass);
	bandpass.connect(whooshGain);
	whooshGain.connect(ctx.destination);
	whiteNoise.start(now);
	whiteNoise.stop(now + .45);
	[
		523.25,
		659.25,
		783.99,
		987.77
	].forEach((freq, idx) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = idx % 2 === 0 ? "sine" : "triangle";
		const startTime = now + .18 + idx * .065;
		osc.frequency.setValueAtTime(freq, startTime);
		gain.gain.setValueAtTime(1e-4, startTime);
		gain.gain.linearRampToValueAtTime(.09 / (idx * .35 + 1), startTime + .02);
		gain.gain.exponentialRampToValueAtTime(1e-4, startTime + .9);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(startTime);
		osc.stop(startTime + .95);
	});
}
function playSealClickSound() {
	const ctx = getAudioContext();
	if (!ctx) return;
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = "triangle";
	osc.frequency.setValueAtTime(320, now);
	osc.frequency.exponentialRampToValueAtTime(110, now + .06);
	gain.gain.setValueAtTime(.12, now);
	gain.gain.exponentialRampToValueAtTime(.001, now + .065);
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start(now);
	osc.stop(now + .07);
}
function playEnvelopeDepartureSound() {
	const ctx = getAudioContext();
	if (!ctx) return;
	const now = ctx.currentTime;
	const bufferSize = Math.floor(ctx.sampleRate * 1.4);
	const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	const output = noiseBuffer.getChannelData(0);
	for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
	const whiteNoise = ctx.createBufferSource();
	whiteNoise.buffer = noiseBuffer;
	const bandpass = ctx.createBiquadFilter();
	bandpass.type = "bandpass";
	bandpass.frequency.setValueAtTime(320, now);
	bandpass.frequency.exponentialRampToValueAtTime(1600, now + .7);
	bandpass.frequency.exponentialRampToValueAtTime(380, now + 1.35);
	bandpass.Q.value = 2.8;
	const whooshGain = ctx.createGain();
	whooshGain.gain.setValueAtTime(.001, now);
	whooshGain.gain.linearRampToValueAtTime(.14, now + .35);
	whooshGain.gain.exponentialRampToValueAtTime(.001, now + 1.38);
	whiteNoise.connect(bandpass);
	bandpass.connect(whooshGain);
	whooshGain.connect(ctx.destination);
	whiteNoise.start(now);
	whiteNoise.stop(now + 1.4);
	const sealTime = now + 2.35;
	const sealOsc = ctx.createOscillator();
	const sealGain = ctx.createGain();
	sealOsc.type = "triangle";
	sealOsc.frequency.setValueAtTime(240, sealTime);
	sealOsc.frequency.exponentialRampToValueAtTime(68, sealTime + .14);
	sealGain.gain.setValueAtTime(.001, sealTime);
	sealGain.gain.linearRampToValueAtTime(.22, sealTime + .02);
	sealGain.gain.exponentialRampToValueAtTime(.001, sealTime + .16);
	sealOsc.connect(sealGain);
	sealGain.connect(ctx.destination);
	sealOsc.start(sealTime);
	sealOsc.stop(sealTime + .17);
	[
		440,
		554.37,
		659.25,
		880,
		1108.73
	].forEach((freq, idx) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		const startTime = now + 2.75 + idx * .08;
		osc.frequency.setValueAtTime(freq, startTime);
		gain.gain.setValueAtTime(1e-4, startTime);
		gain.gain.linearRampToValueAtTime(.08 / (idx * .25 + 1), startTime + .02);
		gain.gain.exponentialRampToValueAtTime(1e-4, startTime + .85);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(startTime);
		osc.stop(startTime + .9);
	});
}
export { playEnvelopeArrivalSound, playSealClickSound, playEnvelopeDepartureSound };
