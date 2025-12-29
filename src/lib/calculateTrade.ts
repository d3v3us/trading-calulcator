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
		tp_percents = [0.07, 0.15, 0.25]
	} = params;

	const normalizedDirection = direction.toLowerCase() as Direction;
	
	// Margin calculation: margin is based on deposit risk percentage
	// Position size scales with leverage (higher leverage = larger position for same margin)
	const margin = deposit * deposit_risk;
	const position = margin * leverage;
	const stop_usd = position * stop_risk;

	let splits: number[];
	if (num_limits <= 1) {
		splits = [1];
	} else if (num_limits === 2) {
		splits = [0.6, 0.4];
	} else {
		splits = [0.5, 0.3, 0.2];
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
		for (let i = 0; i < num_limits; i++) {
			const price = current_price * (1 + distances[i]);
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

