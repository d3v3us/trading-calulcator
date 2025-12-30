export type Direction = 'long' | 'short';
export type LimitStyle = 'increasing' | 'equal' | 'decreasing';
export type PositionSizingMethod = 'fixed' | 'kelly' | 'fixed_fractional' | 'volatility' | 'risk_parity';

export interface TradeLimit {
	price: string;
	margin: string;
}

export interface TakeProfit {
	level: number;
	price: string;
	move_pct: string;
	usd: string;
	risk_reward: string; // Risk/Reward ratio
}

export interface TradeCalculationResult {
	margin: string;
	position: string;
	entry_price: string;
	stop_price: string;
	stop_usd: string;
	liquidation_price: string;
	liquidation_distance_pct: string;
	safety_margin_pct: string;
	limits: TradeLimit[];
	takes: TakeProfit[];
	position_sizing_method?: string;
	position_sizing_note?: string;
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
	position_sizing?: PositionSizingMethod;
	// For Kelly Criterion
	win_rate?: number; // 0-1, e.g., 0.55 = 55%
	avg_win_loss_ratio?: number; // e.g., 2.0 means average win is 2x average loss
	// For Fixed Fractional
	fixed_fraction?: number; // 0-1, e.g., 0.02 = 2% of account per trade
	// For Volatility-based (ATR)
	atr_value?: number; // ATR value for volatility-based sizing
	atr_multiplier?: number; // Multiplier for ATR (default 2.0)
	// For Risk Parity
	target_risk_pct?: number; // Target risk percentage per trade
}

const BASE_LIMITS: Record<Direction, Record<LimitStyle, number[]>> = {
	long: {
		increasing: [-0.002, -0.004, -0.006],
		equal: [-0.005, -0.010, -0.015],
		decreasing: [-0.010, -0.020, -0.030]
	},
	short: {
		increasing: [0.002, 0.004, 0.006],
		equal: [0.01, 0.02, 0.04],
		decreasing: [0.02, 0.04, 0.06]
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
		limit_style = 'increasing',
		deposit_risk = 0.143,
		stop_risk = 0.05,
		// More conservative TPs for high speculative altcoins:
		// TP1: 4% - quick profit target (common altcoin intraday move)
		// TP2: 9% - moderate swing (typical altcoin daily range)
		// TP3: 16% - larger move (still achievable for volatile alts, but conservative vs 25%)
		tp_percents = [0.04, 0.09, 0.16],
		position_sizing = 'fixed',
		win_rate = 0.5,
		avg_win_loss_ratio = 2.0,
		fixed_fraction = 0.02,
		atr_value = 0,
		atr_multiplier = 2.0,
		target_risk_pct = 0.02
	} = params;

	const normalizedDirection = direction.toLowerCase() as Direction;
	
	// Advanced Position Sizing
	let calculated_margin = 0;
	let sizing_method_name = 'Fixed Risk';
	let sizing_note = '';

	if (position_sizing === 'kelly') {
		// Kelly Criterion: f = (bp - q) / b
		// where f = fraction of capital, b = odds (win/loss ratio), p = win probability, q = loss probability
		const p = win_rate;
		const q = 1 - p;
		const b = avg_win_loss_ratio;
		const kelly_fraction = (b * p - q) / b;
		// Use half-Kelly for safety (more conservative)
		const safe_kelly = Math.max(0, Math.min(kelly_fraction * 0.5, 0.25)); // Cap at 25%
		calculated_margin = deposit * safe_kelly;
		sizing_method_name = 'Kelly Criterion (Half-Kelly)';
		sizing_note = `Win Rate: ${(win_rate * 100).toFixed(1)}%, Win/Loss: ${avg_win_loss_ratio.toFixed(2)}x`;
	} else if (position_sizing === 'fixed_fractional') {
		// Fixed Fractional: Risk fixed percentage of account per trade
		calculated_margin = deposit * fixed_fraction;
		sizing_method_name = 'Fixed Fractional';
		sizing_note = `${(fixed_fraction * 100).toFixed(1)}% of account per trade`;
	} else if (position_sizing === 'volatility' && atr_value > 0) {
		// Volatility-based: Size based on ATR (Average True Range)
		// Position size inversely proportional to volatility
		const volatility_factor = atr_value * atr_multiplier;
		const base_risk = deposit * deposit_risk;
		// Reduce position size if volatility is high
		const volatility_adjusted_risk = base_risk / (1 + volatility_factor / current_price);
		calculated_margin = Math.max(volatility_adjusted_risk, deposit * 0.01); // Minimum 1%
		sizing_method_name = 'Volatility-Based (ATR)';
		sizing_note = `ATR: ${atr_value.toFixed(6)}, Multiplier: ${atr_multiplier}x`;
	} else if (position_sizing === 'risk_parity') {
		// Risk Parity: Equal risk contribution across trades
		calculated_margin = deposit * target_risk_pct;
		sizing_method_name = 'Risk Parity';
		sizing_note = `${(target_risk_pct * 100).toFixed(1)}% risk per trade`;
	} else {
		// Fixed: Default method (deposit risk percentage)
		calculated_margin = deposit * deposit_risk;
		sizing_method_name = 'Fixed Risk';
		sizing_note = `${(deposit_risk * 100).toFixed(1)}% of deposit`;
	}

	// Margin calculation: margin is based on deposit risk percentage or advanced sizing
	// Position size scales with leverage (higher leverage = larger position for same margin)
	const margin = calculated_margin;
	const position = margin * leverage;
	const stop_usd = position * stop_risk;

	// Determine margin splits based on limit_style and direction
	// After sorting, splits[0] is always applied to the BEST price for the direction
	// For long: best = lowest price (most negative distance)
	// For short: best = highest price (most positive distance)
	let splits: number[];
	if (num_limits <= 1) {
		splits = [1];
	} else if (limit_style === 'equal') {
		// Equal margin for all limits
		const equalSplit = 1 / num_limits;
		splits = Array(num_limits).fill(equalSplit);
	} else if (limit_style === 'increasing') {
		// Increasing: More margin at better entry prices (aggressive)
		// For long: more margin at lower prices (better buy price = cheaper entry)
		// For short: more margin at higher prices (better sell price = more expensive entry)
		// After sorting, splits[0] is always applied to the BEST price for direction
		if (num_limits === 2) {
			splits = [0.7, 0.3]; // 70% at best price, 30% at worse
		} else {
			splits = [0.6, 0.3, 0.1]; // 60% at best, 30% at middle, 10% at worst
		}
	} else if (limit_style === 'decreasing') {
		// Decreasing: More margin at worse entry prices (conservative, more likely to fill)
		// For long: more margin at higher prices (worse buy price = more expensive, but fills easier)
		// For short: more margin at lower prices (worse sell price = cheaper, but fills easier)
		// After sorting, splits[0] is applied to best price, so we reverse to put more on worse prices
		if (num_limits === 2) {
			splits = [0.4, 0.6]; // 40% at best price, 60% at worse (more conservative)
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
			// Long: sort ascending (most negative first = lowest/best price first)
			// Example: [-0.002, -0.004] -> [-0.004, -0.002] (most negative = best)
			sortedDistances.sort((a, b) => a - b);
		} else {
			// Short: sort descending (most positive first = highest/best price first)
			// Example: [0.002, 0.004] -> [0.004, 0.002] (most positive = best)
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

	// Calculate liquidation price
	// For long: liquidation = entry * (1 - 1/leverage)
	// For short: liquidation = entry * (1 + 1/leverage)
	const liquidation_price = normalizedDirection === 'long'
		? avg_price * (1 - 1 / leverage)
		: avg_price * (1 + 1 / leverage);
	
	// Calculate distance from entry to liquidation
	const liquidation_distance_pct = normalizedDirection === 'long'
		? ((avg_price - liquidation_price) / avg_price) * 100
		: ((liquidation_price - avg_price) / avg_price) * 100;
	
	// Calculate safety margin (distance from stop to liquidation)
	const stop_to_liquidation_pct = normalizedDirection === 'long'
		? ((stop_price - liquidation_price) / avg_price) * 100
		: ((liquidation_price - stop_price) / avg_price) * 100;
	
	const safety_margin_pct = stop_to_liquidation_pct;

	// Calculate Risk/Reward ratios for each TP
	const takes: TakeProfit[] = tp_percents.map((tp, i) => {
		const tp_profit = position * tp * TP_SPLITS[i];
		const risk_reward_ratio = stop_usd > 0 ? (tp_profit / stop_usd) : 0;
		
		return {
			level: i + 1,
			price: (
				normalizedDirection === 'long' ? avg_price * (1 + tp) : avg_price * (1 - tp)
			).toFixed(6),
			move_pct: (tp * 100).toFixed(2),
			usd: tp_profit.toFixed(2),
			risk_reward: risk_reward_ratio.toFixed(2)
		};
	});

	return {
		margin: margin.toFixed(2),
		position: position.toFixed(2),
		entry_price: avg_price.toFixed(6),
		stop_price: stop_price.toFixed(6),
		stop_usd: stop_usd.toFixed(2),
		liquidation_price: liquidation_price.toFixed(6),
		liquidation_distance_pct: liquidation_distance_pct.toFixed(2),
		safety_margin_pct: safety_margin_pct.toFixed(2),
		limits,
		takes,
		position_sizing_method: sizing_method_name,
		position_sizing_note: sizing_note
	};
}

