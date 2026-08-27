import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NumberVaultAudio } from './NumberVaultAudio';

function createMockAudioContext() {
	const nodes: any[] = [];
	const createNode = (type: string) => {
		const node = {
			type,
			connect: vi.fn(() => node),
			start: vi.fn(),
			stop: vi.fn(),
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
			linearRampToValueAtTime: vi.fn(),
			frequency: {
				setValueAtTime: vi.fn(),
				linearRampToValueAtTime: vi.fn(),
				exponentialRampToValueAtTime: vi.fn(),
				value: 0
			},
			gain: {
				setValueAtTime: vi.fn(),
				linearRampToValueAtTime: vi.fn(),
				exponentialRampToValueAtTime: vi.fn()
			},
			Q: { value: 0 }
		};
		nodes.push(node);
		return node;
	};

	const ctx = {
		state: 'running',
		currentTime: 0,
		sampleRate: 44100,
		resume: vi.fn(),
		close: vi.fn(),
		createOscillator: vi.fn(() => createNode('oscillator')),
		createGain: vi.fn(() => createNode('gain')),
		createBuffer: vi.fn((channels: number, size: number) => ({
			getChannelData: () => new Float32Array(size)
		})),
		createBufferSource: vi.fn(() => createNode('bufferSource')),
		createBiquadFilter: vi.fn(() => createNode('filter')),
		destination: {}
	};
	return { ctx, nodes };
}

describe('NumberVaultAudio', () => {
	let mockCtx: ReturnType<typeof createMockAudioContext>;

	beforeEach(() => {
		mockCtx = createMockAudioContext();
		(globalThis as any).window = {
			AudioContext: vi.fn(function () {
				return mockCtx.ctx;
			}),
			webkitAudioContext: vi.fn(function () {
				return mockCtx.ctx;
			})
		};
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	it('does not create an AudioContext for SFX when muted', () => {
		const audio = new NumberVaultAudio();
		audio.setMuted(true);
		audio.playSfx('correct');
		expect(mockCtx.ctx.createOscillator).not.toHaveBeenCalled();
	});

	it('creates oscillators for SFX when unmuted', () => {
		const audio = new NumberVaultAudio();
		audio.setMuted(false);
		audio.playSfx('correct');
		expect(mockCtx.ctx.createOscillator).toHaveBeenCalled();
	});

	it('starts background music when playMusic is called', () => {
		const audio = new NumberVaultAudio();
		audio.setMuted(false);
		audio.playMusic();
		expect(mockCtx.ctx.createOscillator).toHaveBeenCalled();
	});

	it('stops background music when muted and resumes when unmuted', () => {
		const audio = new NumberVaultAudio();
		audio.setMuted(false);
		audio.playMusic();
		audio.setMuted(true);
		expect(audio.getMuted()).toBe(true);

		const callsBeforeResume = mockCtx.ctx.createOscillator.mock.calls.length;
		audio.setMuted(false);
		expect(audio.getMuted()).toBe(false);
		expect(mockCtx.ctx.createOscillator.mock.calls.length).toBeGreaterThan(callsBeforeResume);
	});

	it('stopMusic can be called multiple times without error', () => {
		const audio = new NumberVaultAudio();
		audio.stopMusic();
		audio.playMusic();
		audio.stopMusic();
		expect(audio.getMuted()).toBe(false);
	});

	it('disposes the audio context', () => {
		const audio = new NumberVaultAudio();
		audio.setMuted(false);
		audio.playMusic();
		audio.dispose();
		expect(mockCtx.ctx.close).toHaveBeenCalled();
	});
});
