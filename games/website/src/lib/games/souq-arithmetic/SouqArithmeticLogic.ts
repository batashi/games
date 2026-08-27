export type SouqPhase = 'menu' | 'playing' | 'result';

export type GoodId = 'dates' | 'frankincense' | 'dallah' | 'spice' | 'khanjar';

export type CustomerType = 'villager' | 'sailor' | 'falconer' | 'merchant';

export interface Good {
	id: GoodId;
	nameAr: string;
	nameEn: string;
	price: number; // in baisa (1 rial = 100 baisa) to avoid floats
	icon: string;
}

export const GOODS: Good[] = [
	{ id: 'dates', nameAr: 'تمر', nameEn: 'Dates', price: 50, icon: '🌴' },
	{ id: 'frankincense', nameAr: 'لبان', nameEn: 'Frankincense', price: 125, icon: '🌿' },
	{ id: 'dallah', nameAr: 'دلة', nameEn: 'Dallah', price: 200, icon: '☕' },
	{ id: 'spice', nameAr: 'بهار', nameEn: 'Spice', price: 75, icon: '🌶️' },
	{ id: 'khanjar', nameAr: 'خنجر', nameEn: 'Khanjar', price: 350, icon: '🗡️' }
];

export const COIN_VALUES = [25, 50, 100, 200, 500]; // baisa

export interface Customer {
	id: number;
	type: CustomerType;
	order: Record<GoodId, number>;
	payment: number; // baisa
	patience: number; // seconds remaining
	maxPatience: number;
	arrivalTime: number;
}

export interface RestockProblem {
	questionAr: string;
	questionEn: string;
	answer: number;
	options: number[];
}

export interface SouqArithmeticState {
	phase: SouqPhase;
	level: number;
	score: number;
	combo: number;
	maxCombo: number;
	reputation: number;
	maxReputation: number;
	customersServed: number;
	customerQuota: number;
	timeRemaining: number;
	customer: Customer | null;
	cart: Record<GoodId, number>;
	changeGiven: number; // baisa
	stock: Record<GoodId, number>;
	feedback: 'none' | 'correct' | 'incorrect' | 'slow';
	feedbackMessage: string;
	restockProblem: RestockProblem | null;
	completed: boolean;
	stars: number;
	accuracy: number; // 0–100
	checkoutReady: boolean; // true when cart matches order
}

export interface SouqArithmeticLevelConfig {
	level: number;
	customers: number;
	timeSeconds: number;
	operations: ('add' | 'subtract' | 'multiply' | 'mixed')[];
	exactPayment: boolean;
	allowDiscounts: boolean;
	restockEvery: number;
}

export const SOUQ_LEVELS: SouqArithmeticLevelConfig[] = [
	{
		level: 1,
		customers: 5,
		timeSeconds: 90,
		operations: ['add'],
		exactPayment: true,
		allowDiscounts: false,
		restockEvery: 99
	},
	{
		level: 2,
		customers: 6,
		timeSeconds: 90,
		operations: ['add', 'subtract'],
		exactPayment: false,
		allowDiscounts: false,
		restockEvery: 99
	},
	{
		level: 3,
		customers: 7,
		timeSeconds: 100,
		operations: ['add', 'subtract'],
		exactPayment: false,
		allowDiscounts: false,
		restockEvery: 4
	},
	{
		level: 4,
		customers: 8,
		timeSeconds: 110,
		operations: ['add', 'subtract', 'multiply'],
		exactPayment: false,
		allowDiscounts: true,
		restockEvery: 4
	},
	{
		level: 5,
		customers: 10,
		timeSeconds: 120,
		operations: ['add', 'subtract', 'multiply', 'mixed'],
		exactPayment: false,
		allowDiscounts: true,
		restockEvery: 3
	}
];

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

export function formatMoney(baisa: number): string {
	const riyals = Math.floor(baisa / 100);
	const remaining = baisa % 100;
	if (remaining === 0) return `${riyals} ر.ع`;
	return `${riyals}.${remaining.toString().padStart(2, '0')} ر.ع`;
}

export function formatMoneyEn(baisa: number): string {
	const riyals = Math.floor(baisa / 100);
	const remaining = baisa % 100;
	if (remaining === 0) return `OMR ${riyals}`;
	return `OMR ${riyals}.${remaining.toString().padStart(2, '0')}`;
}

export function orderTotal(order: Record<GoodId, number>): number {
	return GOODS.reduce((sum, good) => sum + (order[good.id] ?? 0) * good.price, 0);
}

export function cartTotal(cart: Record<GoodId, number>): number {
	return GOODS.reduce((sum, good) => sum + (cart[good.id] ?? 0) * good.price, 0);
}

function choosePayment(total: number, exact: boolean, type: CustomerType): number {
	if (exact) return total;
	const notes = [100, 200, 500, 1000];
	if (type === 'falconer') {
		return total <= 500 ? 500 : 1000;
	}
	for (const note of notes) {
		if (note >= total + 25) return note;
	}
	return 1000;
}

function generateOrder(level: SouqArithmeticLevelConfig, type: CustomerType): Record<GoodId, number> {
	const order: Record<GoodId, number> = { dates: 0, frankincense: 0, dallah: 0, spice: 0, khanjar: 0 };
	let itemCount: number;
	let allowedGoods: GoodId[];

	if (type === 'villager') {
		itemCount = randomInt(1, 2);
		allowedGoods = ['dates', 'spice'];
	} else if (type === 'sailor') {
		itemCount = randomInt(2, 3);
		allowedGoods = ['dates', 'frankincense', 'dallah', 'spice'];
	} else if (type === 'falconer') {
		itemCount = randomInt(1, 2);
		allowedGoods = ['dallah', 'khanjar', 'frankincense'];
	} else {
		// merchant
		itemCount = randomInt(2, 3);
		allowedGoods = ['dates', 'frankincense', 'dallah', 'spice', 'khanjar'];
	}

	for (let i = 0; i < itemCount; i++) {
		const goodId = allowedGoods[randomInt(0, allowedGoods.length - 1)];
		const maxQty = level.level >= 4 ? 3 : 2;
		order[goodId] = (order[goodId] ?? 0) + randomInt(1, maxQty);
	}

	return order;
}

function generateCustomer(level: SouqArithmeticLevelConfig, id: number): Customer {
	const isBoss = level.allowDiscounts && id > 0 && id % 5 === 0;
	const type: CustomerType = isBoss
		? 'merchant'
		: (['villager', 'sailor', 'falconer'] as CustomerType[])[randomInt(0, 2)];
	const order = generateOrder(level, type);
	const total = orderTotal(order);
	const payment = choosePayment(total, level.exactPayment, type);

	const patienceMap: Record<CustomerType, number> = {
		villager: 12,
		sailor: 10,
		falconer: 10,
		merchant: 14
	};

	return {
		id,
		type,
		order,
		payment,
		patience: patienceMap[type],
		maxPatience: patienceMap[type],
		arrivalTime: Date.now()
	};
}

export function generateRestockProblem(level: SouqArithmeticLevelConfig): RestockProblem {
	const operations = level.operations.filter((op) => op === 'multiply' || op === 'mixed');
	const operation = operations.length > 0 && Math.random() > 0.5 ? 'divide' : 'multiply';

	let answer: number;
	let questionAr: string;
	let questionEn: string;

	if (operation === 'multiply') {
		const a = randomInt(2, 9);
		const b = randomInt(3, 12);
		answer = a * b;
		questionAr = `كم تاريخة في ${a} سلال × ${b} تمرات؟`;
		questionEn = `How many dates in ${a} baskets × ${b} dates?`;
	} else {
		const b = randomInt(3, 9);
		answer = randomInt(3, 12);
		const a = answer * b;
		questionAr = `كم سلّة نحتاج لتوزيع ${a} تمرة في مجموعات من ${b}؟`;
		questionEn = `How many baskets for ${a} dates in groups of ${b}?`;
	}

	const distractors = new Set<number>();
	while (distractors.size < 3) {
		const d = answer + randomInt(-10, 10);
		if (d > 0 && d !== answer) distractors.add(d);
	}

	return {
		questionAr,
		questionEn,
		answer,
		options: shuffle([answer, ...distractors])
	};
}

export interface SouqArithmeticCallbacks {
	onCustomerArrive?: () => void;
	onCorrect?: () => void;
	onIncorrect?: () => void;
	onRestock?: () => void;
	onLevelComplete?: (stars: number) => void;
}

export class SouqArithmeticLogic {
	private onChange: (state: SouqArithmeticState) => void;
	private callbacks: SouqArithmeticCallbacks;

	private phase: SouqPhase = 'menu';
	private levelConfig: SouqArithmeticLevelConfig = SOUQ_LEVELS[0];
	private score = 0;
	private combo = 0;
	private maxCombo = 0;
	private reputation = 3;
	private maxReputation = 3;
	private customersServed = 0;
	private timeRemaining = 0;
	private customer: Customer | null = null;
	private cart: Record<GoodId, number> = { dates: 0, frankincense: 0, dallah: 0, spice: 0, khanjar: 0 };
	private changeGiven = 0;
	private stock: Record<GoodId, number> = { dates: 10, frankincense: 10, dallah: 10, spice: 10, khanjar: 10 };
	private feedback: SouqArithmeticState['feedback'] = 'none';
	private feedbackMessage = '';
	private restockProblem: RestockProblem | null = null;
	private completed = false;
	private stars = 0;
	private accuracy = 100;
	private attempts = 0;
	private correctCount = 0;

	private nextCustomerId = 1;
	private tickTimer: ReturnType<typeof setInterval> | null = null;
	private lastActionAt = 0;
	private customerServedSinceRestock = 0;

	constructor(
		onChange: (state: SouqArithmeticState) => void,
		callbacks: SouqArithmeticCallbacks = {}
	) {
		this.onChange = onChange;
		this.callbacks = callbacks;
		this.emit();
	}

	getState(): SouqArithmeticState {
		return {
			phase: this.phase,
			level: this.levelConfig.level,
			score: this.score,
			combo: this.combo,
			maxCombo: this.maxCombo,
			reputation: this.reputation,
			maxReputation: this.maxReputation,
			customersServed: this.customersServed,
			customerQuota: this.levelConfig.customers,
			timeRemaining: Math.max(0, this.timeRemaining),
			customer: this.customer,
			cart: { ...this.cart },
			changeGiven: this.changeGiven,
			stock: { ...this.stock },
			feedback: this.feedback,
			feedbackMessage: this.feedbackMessage,
			restockProblem: this.restockProblem,
			completed: this.phase === 'result',
			stars: this.stars,
			accuracy: this.attempts === 0 ? 100 : Math.round((this.correctCount / this.attempts) * 100),
			checkoutReady: this.checkoutReady()
		};
	}

	private emit(): void {
		this.onChange(this.getState());
	}

	startLevel(level: number): void {
		const config = SOUQ_LEVELS.find((l) => l.level === level);
		if (!config) return;

		this.levelConfig = config;
		this.phase = 'playing';
		this.score = 0;
		this.combo = 0;
		this.maxCombo = 0;
		this.reputation = 3;
		this.maxReputation = 3;
		this.customersServed = 0;
		this.timeRemaining = config.timeSeconds;
		this.cart = { dates: 0, frankincense: 0, dallah: 0, spice: 0, khanjar: 0 };
		this.changeGiven = 0;
		this.stock = { dates: 10, frankincense: 10, dallah: 10, spice: 10, khanjar: 10 };
		this.feedback = 'none';
		this.feedbackMessage = '';
		this.restockProblem = null;
		this.completed = false;
		this.stars = 0;
		this.attempts = 0;
		this.correctCount = 0;
		this.customerServedSinceRestock = 0;

		this.startTick();
		this.spawnCustomer();
	}

	restartLevel(): void {
		this.stopTick();
		this.startLevel(this.levelConfig.level);
	}

	backToMenu(): void {
		this.stopTick();
		this.phase = 'menu';
		this.customer = null;
		this.restockProblem = null;
		this.emit();
	}

	private startTick(): void {
		this.stopTick();
		this.tickTimer = setInterval(() => this.tick(), 100);
	}

	private stopTick(): void {
		if (this.tickTimer) {
			clearInterval(this.tickTimer);
			this.tickTimer = null;
		}
	}

	private tick(): void {
		if (this.phase !== 'playing') return;

		this.timeRemaining = Math.max(0, this.timeRemaining - 0.1);

		if (this.customer && this.restockProblem === null) {
			this.customer.patience = Math.max(0, this.customer.patience - 0.1);
			if (this.customer.patience <= 0) {
				this.customerLeavesAngry();
			}
		}

		if (this.timeRemaining <= 0) {
			this.completeLevel();
			return;
		}

		this.emit();
	}

	private spawnCustomer(): void {
		if (this.customersServed >= this.levelConfig.customers) {
			this.completeLevel();
			return;
		}

		// Check if restock is needed.
		if (
			this.customerServedSinceRestock >= this.levelConfig.restockEvery &&
			this.levelConfig.restockEvery < 99
		) {
			this.restockProblem = generateRestockProblem(this.levelConfig);
			this.customer = null;
			this.callbacks.onRestock?.();
		} else {
			this.customer = generateCustomer(this.levelConfig, this.nextCustomerId++);
			this.lastActionAt = Date.now();
			this.callbacks.onCustomerArrive?.();
		}

		this.cart = { dates: 0, frankincense: 0, dallah: 0, spice: 0, khanjar: 0 };
		this.changeGiven = 0;
		this.feedback = 'none';
		this.feedbackMessage = '';
		this.emit();
	}

	addToCart(goodId: GoodId): void {
		if (this.phase !== 'playing' || !this.customer || this.restockProblem) return;
		if ((this.stock[goodId] ?? 0) <= 0) return;
		this.cart[goodId] = (this.cart[goodId] ?? 0) + 1;
		this.stock[goodId]--;
		this.emit();
	}

	removeFromCart(goodId: GoodId): void {
		if (this.phase !== 'playing' || !this.customer || this.restockProblem) return;
		if ((this.cart[goodId] ?? 0) <= 0) return;
		this.cart[goodId]--;
		this.stock[goodId]++;
		this.emit();
	}

	addChange(coin: number): void {
		if (this.phase !== 'playing' || !this.customer || this.restockProblem) return;
		if (!COIN_VALUES.includes(coin)) return;
		this.changeGiven += coin;
		this.emit();
	}

	removeChange(coin: number): void {
		if (this.phase !== 'playing' || !this.customer || this.restockProblem) return;
		if (!COIN_VALUES.includes(coin) || this.changeGiven < coin) return;
		this.changeGiven -= coin;
		this.emit();
	}

	submitTransaction(): void {
		if (this.phase !== 'playing' || !this.customer || this.restockProblem) return;

		this.attempts++;
		const expectedTotal = orderTotal(this.customer.order);
		const cartValue = cartTotal(this.cart);
		const expectedChange = this.customer.payment - expectedTotal;
		const elapsed = (Date.now() - this.lastActionAt) / 1000;

		if (cartValue !== expectedTotal || this.changeGiven !== expectedChange) {
			this.handleIncorrect();
			return;
		}

		this.handleCorrect(elapsed);
	}

	private handleCorrect(elapsed: number): void {
		const fast = elapsed <= 4;
		if (fast) {
			this.combo++;
			this.maxCombo = Math.max(this.maxCombo, this.combo);
		} else {
			this.combo = 0;
		}

		const baseScore = this.customer?.type === 'merchant' ? 30 : 10;
		const comboBonus = Math.min(this.combo * 2, 20);
		const fastBonus = fast ? 5 : 0;
		this.score += baseScore + comboBonus + fastBonus;
		this.correctCount++;
		this.customersServed++;
		this.customerServedSinceRestock++;

		this.feedback = fast ? 'correct' : 'slow';
		if (fast && this.combo >= 5) {
			this.feedbackMessage = 'بيعة رائعة! 🌟';
		} else if (fast && this.combo >= 3) {
			this.feedbackMessage = 'زبون سعيد! 💰';
		} else if (fast) {
			this.feedbackMessage = 'صحيح! 💵';
		} else {
			this.feedbackMessage = 'صحيح، لكن أسرع! ⏱️';
		}

		this.customer = null;
		this.callbacks.onCorrect?.();
		this.emit();
		this.spawnCustomer();
	}

	private handleIncorrect(): void {
		this.combo = 0;
		this.reputation = Math.max(0, this.reputation - 1);
		this.feedback = 'incorrect';
		this.feedbackMessage = 'خطأ! غاضب الزبون 😤';

		// Return cart items to stock.
		for (const good of GOODS) {
			this.stock[good.id] += this.cart[good.id] ?? 0;
			this.cart[good.id] = 0;
		}
		this.changeGiven = 0;

		this.callbacks.onIncorrect?.();

		if (this.reputation <= 0) {
			this.completeLevel();
			return;
		}

		this.emit();
		this.spawnCustomer();
	}

	private customerLeavesAngry(): void {
		this.combo = 0;
		this.reputation = Math.max(0, this.reputation - 1);
		this.attempts++;
		this.feedback = 'incorrect';
		this.feedbackMessage = 'الزبون غادر غاضباً! 😤';

		// Return cart items to stock.
		for (const good of GOODS) {
			this.stock[good.id] += this.cart[good.id] ?? 0;
			this.cart[good.id] = 0;
		}
		this.changeGiven = 0;

		this.callbacks.onIncorrect?.();

		if (this.reputation <= 0) {
			this.completeLevel();
			return;
		}

		this.customer = null;
		this.emit();
		this.spawnCustomer();
	}

	submitRestock(answer: number): void {
		if (this.phase !== 'playing' || !this.restockProblem) return;

		this.attempts++;
		if (answer === this.restockProblem.answer) {
			this.correctCount++;
			this.stock = { dates: 10, frankincense: 10, dallah: 10, spice: 10, khanjar: 10 };
			this.score += 15;
			this.feedback = 'correct';
			this.feedbackMessage = 'تمت إعادة التزويد! 📦';
			this.restockProblem = null;
			this.customerServedSinceRestock = 0;
			this.callbacks.onRestock?.();
			this.emit();
			this.spawnCustomer();
		} else {
			this.combo = 0;
			this.timeRemaining = Math.max(0, this.timeRemaining - 5);
			this.feedback = 'incorrect';
			this.feedbackMessage = 'خطأ! خسارة وقت ⏳';
			this.emit();
		}
	}

	showHint(): void {
		if (this.phase !== 'playing') return;
		if (this.restockProblem) {
			this.feedback = 'slow';
			this.feedbackMessage = this.restockProblem.questionAr;
		} else if (this.customer) {
			const expectedTotal = orderTotal(this.customer.order);
			const expectedChange = this.customer.payment - expectedTotal;
			this.feedback = 'slow';
			this.feedbackMessage = `المجموع: ${formatMoney(expectedTotal)} — الباقي: ${formatMoney(expectedChange)}`;
		}
		this.emit();
	}

	private checkoutReady(): boolean {
		if (!this.customer || this.restockProblem) return false;
		return cartTotal(this.cart) === orderTotal(this.customer.order);
	}

	private completeLevel(): void {
		this.stopTick();

		const accuracy = this.attempts === 0 ? 100 : Math.round((this.correctCount / this.attempts) * 100);

		if (this.reputation <= 0 || this.customersServed < this.levelConfig.customers) {
			this.stars = 0;
		} else if (accuracy >= 90 && this.maxCombo >= 5) {
			this.stars = 3;
		} else if (accuracy >= 80) {
			this.stars = 2;
		} else {
			this.stars = 1;
		}

		this.phase = 'result';
		this.customer = null;
		this.restockProblem = null;
		this.feedback = 'none';
		this.feedbackMessage =
			this.stars > 0 ? 'يوم سوق ممتاز! 🏆' : 'انتهى السوق بخسارة. حاول مرة أخرى.';
		this.callbacks.onLevelComplete?.(this.stars);
		this.emit();
	}

	dispose(): void {
		this.stopTick();
	}
}
