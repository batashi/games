import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameAudio } from './FortBattleGame';

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
				exponentialRampToValueAtTime: vi.fn()
			},
			// BiquadFilter uses frequency directly; duplicate for convenience.
			gain: {
				setValueAtTime: vi.fn(),
				linearRampToValueAtTime: vi.fn(),
				exponentialRampToValueAtTime: vi.fn()
			}
		};
		nodes.push(node);
		return node;
	};

	const ctx = {
		state: 'running',
		currentTime: 0,
		sampleRate: 44100,
		resume: vi.fn(),
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

describe('GameAudio', () => {
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
		const audio = new GameAudio();
		audio.setMuted(true);
		audio.playShoot();
		expect(mockCtx.ctx.createOscillator).not.toHaveBeenCalled();
	});

	it('creates oscillators for SFX when unmuted', () => {
		const audio = new GameAudio();
		audio.setMuted(false);
		audio.playShoot();
		expect(mockCtx.ctx.createOscillator).toHaveBeenCalled();
	});

	it('starts background music when playMusic is called', () => {
		const audio = new GameAudio();
		audio.setMuted(false);
		audio.playMusic();
		expect(mockCtx.ctx.createOscillator).toHaveBeenCalled();
	});

	it('stops background music when muted and resumes when unmuted', () => {
		const audio = new GameAudio();
		audio.setMuted(false);
		audio.playMusic();
		audio.setMuted(true);
		expect(audio.getMuted()).toBe(true);

		const callsBeforeResume = mockCtx.ctx.createOscillator.mock.calls.length;
		audio.setMuted(false);
		expect(audio.getMuted()).toBe(false);
		// Resuming music should schedule another bar immediately.
		expect(mockCtx.ctx.createOscillator.mock.calls.length).toBeGreaterThan(callsBeforeResume);
	});

	it('stopMusic can be called multiple times without error', () => {
		const audio = new GameAudio();
		audio.stopMusic();
		audio.playMusic();
		audio.stopMusic();
		expect(audio.getMuted()).toBe(false);
	});
});
