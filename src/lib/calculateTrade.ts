export type Direction = 'long' | 'short';
export type LimitStyle = 'aggressive' | 'equal' | 'moderate';

export interface TradeLimit {
	price: string;
	margin: string;
}

export interface TakeProfit {
	level: number;
	price: string;
	move_pct: string;
	usd: string;
}

export interface TradeCalculationResult {
	margin: string;
	position: string;
	entry_price: string;
	stop_price: string;
	stop_usd: string;
	limits: TradeLimit[];
	takes: TakeProfit[];
}

export interface TradeCalculationParams {
	deposit: number;
	direction: Direction;
	current_price: number;
	leverage: number;
	num_limits?: number;
	limit_style?: LimitStyle;
	deposit_risk?: number;
	stop_risk?: number;
	tp_percents?: number[];
}

const BASE_LIMITS: Record<Direction, Record<LimitStyle, number[]>> = {
	long: {
		aggressive: [-0.002, -0.004, -0.006],
		equal: [-0.005, -0.010, -0.015],
		moderate: [-0.010, -0.020, -0.030]
	},
	short: {
		aggressive: [0.002, 0.004, 0.006],
		equal: [0.01, 0.02, 0.04],
		moderate: [0.02, 0.04, 0.06]
	}
};

const TP_SPLITS = [0.4, 0.35, 0.25];

export function calculateTrade3TP(params: TradeCalculationParams): TradeCalculationResult {
	const {
		deposit,
		direction,
		current_price,
		leverage,
		num_limits = 2,
		limit_style = 'aggressive',
		deposit_risk = 0.143,
		stop_risk = 0.05,
		// More conservative TPs for high speculative altcoins:
		// TP1: 4% - quick profit target (common altcoin intraday move)
		// TP2: 9% - moderate swing (typical altcoin daily range)
		// TP3: 16% - larger move (still achievable for volatile alts, but conservative vs 25%)
		tp_percents = [0.04, 0.09, 0.16]
	} = params;

	const normalizedDirection = direction.toLowerCase() as Direction;
	
	// Margin calculation: margin is based on deposit risk percentage
	// Position size scales with leverage (higher leverage = larger position for same margin)
	const margin = deposit * deposit_risk;
	const position = margin * leverage;
	const stop_usd = position * stop_risk;

	// Determine margin splits based on limit_style
	let splits: number[];
	if (num_limits <= 1) {
		splits = [1];
	} else if (limit_style === 'equal') {
		// Equal margin for all limits
		const equalSplit = 1 / num_limits;
		splits = Array(num_limits).fill(equalSplit);
	} else if (limit_style === 'aggressive') {
		// Aggressive: More margin at better entry prices (earlier limits)
		// Try to move entry point higher by using more margin at better prices
		if (num_limits === 2) {
			splits = [0.7, 0.3]; // 70% at better price, 30% at worse
		} else {
			splits = [0.6, 0.3, 0.1]; // 60% at best, 30% at middle, 10% at worst
		}
	} else if (limit_style === 'moderate') {
		// Moderate: More margin at worse entry prices (later limits)
		// More conservative, enter with higher margin at less optimal prices
		if (num_limits === 2) {
			splits = [0.4, 0.6]; // 40% at better price, 60% at worse (more conservative)
		} else {
			splits = [0.3, 0.3, 0.4]; // 30% at best, 30% at middle, 40% at worst (most conservative)
		}
	} else {
		// Fallback (shouldn't happen)
		splits = num_limits === 2 ? [0.5, 0.5] : [0.33, 0.33, 0.34];
	}

	const limits: TradeLimit[] = [];
	let avg_price = 0;
	const split_sum = splits.reduce((a, b) => a + b, 0);

	if (num_limits === 0) {
		avg_price = current_price;
		limits.push({
			price: current_price.toFixed(6),
			margin: margin.toFixed(2)
		});
	} else {
		const distances = BASE_LIMITS[normalizedDirection][limit_style];
		
		// For long: better price = lower price (more negative distance)
		// For short: better price = higher price (more positive distance)
		// Sort so first limit is always the BEST price for that direction
		const sortedDistances = [...distances].slice(0, num_limits);
		if (normalizedDirection === 'long') {
			// Long: sort descending (most negative first = lowest/best price first)
			sortedDistances.sort((a, b) => b - a);
		} else {
			// Short: sort descending (most positive first = highest/best price first)
			sortedDistances.sort((a, b) => b - a);
		}
		
		for (let i = 0; i < num_limits; i++) {
			const price = current_price * (1 + sortedDistances[i]);
			const margin_part = margin * splits[i];
			limits.push({
				price: price.toFixed(6),
				margin: margin_part.toFixed(2)
			});
			avg_price += price * splits[i];
		}
		avg_price /= split_sum;
	}

	const stop_price =
		normalizedDirection === 'long'
			? avg_price * (1 - stop_risk)
			: avg_price * (1 + stop_risk);

	const takes: TakeProfit[] = tp_percents.map((tp, i) => ({
		level: i + 1,
		price: (
			normalizedDirection === 'long' ? avg_price * (1 + tp) : avg_price * (1 - tp)
		).toFixed(6),
		move_pct: (tp * 100).toFixed(2),
		usd: (position * tp * TP_SPLITS[i]).toFixed(2)
	}));

	return {
		margin: margin.toFixed(2),
		position: position.toFixed(2),
		entry_price: avg_price.toFixed(6),
		stop_price: stop_price.toFixed(6),
		stop_usd: stop_usd.toFixed(2),
		limits,
		takes
	};
}

