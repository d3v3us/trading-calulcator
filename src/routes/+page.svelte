<script lang="ts">
	import { calculateTrade3TP, type Direction, type LimitStyle, type TradeCalculationResult } from '$lib/calculateTrade';
	import Loader from '$lib/Loader.svelte';

	let deposit = 1290;
	let direction: Direction = 'short';
	let currentPrice = 0.466;
	let leverage = 7;
	let numLimits = 2;
	let limitStyle: LimitStyle = 'aggressive';

	// Calculate deposit_risk from leverage: deposit_risk = 1 / leverage
	// For leverage 7, deposit_risk = 1/7 ≈ 0.143 (14.3%)
	$: depositRisk = (1 / leverage) * 100; // Convert to percentage

	const leverageOptions = [3, 5, 7, 9, 12, 20, 27, 30, 40, 50];
	const highLeverageThreshold = 20;

	function getLeverageEmotion(lev: number): string {
		if (lev === 7) return '😄'; // Happiest at 7
		if (lev <= 5) return '🙂'; // Lower than 7, still okay
		if (lev <= 9) return '😐'; // Slightly above optimal
		if (lev <= 12) return '😟'; // Getting risky
		if (lev <= 20) return '😰'; // High risk
		if (lev <= 30) return '😢'; // Very high risk
		return '😭'; // Extremely high risk (40, 50)
	}

	function getLeverageMessage(lev: number): { text: string; type: 'success' | 'warning' | 'danger' } {
		if (lev === 7) {
			return {
				text: '✅ Perfect! This is the optimal leverage for balanced risk and reward.',
				type: 'success'
			};
		}
		if (lev <= 5) {
			return {
				text: '✅ Conservative leverage. Safe but lower profit potential.',
				type: 'success'
			};
		}
		if (lev <= 9) {
			return {
				text: '⚠️ Moderate leverage. Slightly above optimal, monitor your risk carefully.',
				type: 'warning'
			};
		}
		if (lev <= 12) {
			return {
				text: '⚠️ Elevated risk. Higher leverage increases both profit and loss potential.',
				type: 'warning'
			};
		}
		if (lev <= 20) {
			return {
				text: '🚨 High risk! This leverage significantly increases your risk exposure.',
				type: 'danger'
			};
		}
		if (lev <= 30) {
			return {
				text: '🚨 Very high risk! Extreme caution required. Consider reducing leverage.',
				type: 'danger'
			};
		}
		return {
			text: '🚨 Extreme risk! This leverage level is extremely dangerous. Strongly consider using lower leverage.',
			type: 'danger'
		};
	}

	let result: TradeCalculationResult | null = null;
	let showOutput = false;
	let isLoading = false;
	let copiedValue: string | null = null;

	async function copyToClipboard(value: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(value);
			copiedValue = value;
			setTimeout(() => {
				copiedValue = null;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	async function handleCalculate(): Promise<void> {
		isLoading = true;
		showOutput = false;

		// Small delay to show loader (calculation is instant, so we add a brief delay for UX)
		await new Promise(resolve => setTimeout(resolve, 300));

		const calculationResult = calculateTrade3TP({
			deposit,
			direction,
			current_price: currentPrice,
			leverage,
			num_limits: numLimits,
			limit_style: limitStyle,
			deposit_risk: depositRisk / 100 // Convert percentage to decimal
		});

		result = calculationResult;
		showOutput = true;
		isLoading = false;
	}

</script>

<div class="min-h-screen futuristic-bg p-6">
	<div class="max-w-7xl mx-auto relative z-10">
		<div class="mb-12 text-center">
			<h1 class="premium-title">
				<span class="title-main">Trading</span>
				<span class="title-accent">Calculator</span>
			</h1>
			<div class="title-subtitle">Precision Trading · 3 Take Profit Strategy</div>
		</div>
		
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- LEFT: FORM -->
			<div class="rounded-2xl glass-card p-6">
				<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="text-sm font-medium text-indigo-300 mb-2 block">Deposit ($)</label>
				<input
					type="number"
					bind:value={deposit}
					class="mt-1 w-full rounded-lg futuristic-input px-3 py-2 text-sm text-indigo-100 placeholder-indigo-500"
				/>
			</div>

			<div>
				<label class="text-sm font-medium text-indigo-300 mb-2 block">Direction</label>
				<select
					bind:value={direction}
					class="mt-1 w-full rounded-lg futuristic-input px-3 py-2 text-sm text-indigo-100"
				>
					<option value="long" class="bg-gray-900">Long</option>
					<option value="short" class="bg-gray-900">Short</option>
				</select>
			</div>

			<div>
				<label class="text-sm font-medium text-indigo-300 mb-2 block">Current price</label>
				<input
					type="number"
					step="0.000001"
					bind:value={currentPrice}
					class="mt-1 w-full rounded-lg futuristic-input px-3 py-2 text-sm text-indigo-100 placeholder-indigo-500"
				/>
			</div>

			<div>
				<label class="text-sm font-medium text-indigo-300 mb-2 block">Leverage</label>
				<div class="flex items-center gap-2">
					<select
						bind:value={leverage}
						class="mt-1 flex-1 rounded-lg futuristic-input px-3 py-2 text-sm text-indigo-100"
					>
						{#each leverageOptions as option}
							<option value={option} class="bg-gray-900">{option}x</option>
						{/each}
					</select>
					<div class="mt-1 text-2xl">
						{getLeverageEmotion(leverage)}
					</div>
				</div>
				{#if true}
					{@const message = getLeverageMessage(leverage)}
					{#if message.type === 'success'}
						<div class="mt-2 rounded-lg glass-card px-3 py-2 text-sm text-green-300 border border-green-500/30">
							{message.text}
						</div>
					{:else if message.type === 'warning'}
						<div class="mt-2 rounded-lg glass-card px-3 py-2 text-sm text-yellow-300 border border-yellow-500/30">
							{message.text}
						</div>
					{:else if message.type === 'danger'}
						<div class="mt-2 rounded-lg glass-card px-3 py-2 text-sm text-red-300 border border-red-500/30">
							{message.text}
						</div>
					{/if}
				{/if}
			</div>

			<div>
				<label class="text-sm font-medium text-indigo-300 mb-2 block">Deposit Risk (%)</label>
				<div class="mt-1 w-full rounded-lg glass-card px-3 py-2 text-sm text-indigo-200 font-mono">
					{depositRisk.toFixed(2)}%
				</div>
				<p class="mt-1 text-xs text-indigo-400/70">Auto-calculated from leverage</p>
			</div>

			<div>
				<label class="text-sm font-medium text-indigo-300 mb-2 block">Limits count</label>
				<select
					bind:value={numLimits}
					class="mt-1 w-full rounded-lg futuristic-input px-3 py-2 text-sm text-indigo-100"
				>
					<option value={0} class="bg-gray-900">0</option>
					<option value={1} class="bg-gray-900">1</option>
					<option value={2} class="bg-gray-900">2</option>
					<option value={3} class="bg-gray-900">3</option>
				</select>
			</div>

			<div class="col-span-2">
				<label class="text-sm font-medium text-indigo-300 mb-2 block">Limit style</label>
				<select
					bind:value={limitStyle}
					class="mt-1 w-full rounded-lg futuristic-input px-3 py-2 text-sm text-indigo-100"
				>
					<option value="aggressive" class="bg-gray-900">Aggressive</option>
					<option value="equal" class="bg-gray-900">Equal</option>
					<option value="moderate" class="bg-gray-900">Moderate</option>
				</select>
			</div>
				</div>

				<button
					type="button"
					on:click={handleCalculate}
					disabled={isLoading}
					class="mt-6 w-full rounded-lg futuristic-button px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-2 relative overflow-hidden"
				>
					{#if isLoading}
						<Loader size="sm" />
						<span>Calculating...</span>
					{:else}
						Calculate
					{/if}
				</button>
			</div>

			<!-- RIGHT: RESULTS TABLE -->
			<div class="lg:sticky lg:top-6 lg:h-fit">
				{#if isLoading}
					<div class="rounded-2xl glass-card p-6 flex items-center justify-center py-12">
						<Loader size="md" />
					</div>
				{:else if showOutput && result && !isLoading}
					<div class="rounded-2xl glass-card-glow p-6 space-y-6 table-animate">
						<!-- SUMMARY -->
				<div>
					<h3 class="text-sm font-semibold mb-3 neon-text">Summary</h3>
					<table class="w-full text-sm border-collapse">
						<tbody>
							<tr class="border-b border-indigo-500/20">
								<td class="py-2 pr-4 font-medium text-indigo-300">Margin</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono text-indigo-100">${result.margin}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.margin)}
											class="text-xs px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/20 transition"
											title="Copy margin"
										>
											{#if copiedValue === result?.margin}
												<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
												</svg>
											{/if}
										</button>
									</div>
								</td>
							</tr>
							<tr class="border-b border-indigo-500/20">
								<td class="py-2 pr-4 font-medium text-indigo-300">Position</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono text-indigo-100">${result.position}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.position)}
											class="text-xs px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/20 transition"
											title="Copy position"
										>
											{#if copiedValue === result?.position}
												<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
												</svg>
											{/if}
										</button>
									</div>
								</td>
							</tr>
							<tr>
								<td class="py-2 pr-4 font-medium text-indigo-300">Entry price</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono text-indigo-100">{result.entry_price}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.entry_price)}
											class="text-xs px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/20 transition"
											title="Copy entry price"
										>
											{#if copiedValue === result?.entry_price}
												<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
												</svg>
											{/if}
										</button>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<!-- ENTRIES -->
				<div>
					<h3 class="text-sm font-semibold mb-3 neon-text">Entries</h3>
					<table class="w-full text-sm border-collapse">
						<thead>
							<tr class="border-b border-indigo-500/30 bg-indigo-500/10">
								<th class="text-left py-2 px-3 font-medium text-indigo-300">#</th>
								<th class="text-left py-2 px-3 font-medium text-indigo-300">Price</th>
								<th class="text-left py-2 px-3 font-medium text-indigo-300">Margin</th>
							</tr>
						</thead>
						<tbody>
							{#each result.limits as limit, i}
								<tr class="border-b border-indigo-500/20">
									<td class="py-2 px-3 text-indigo-200">{i + 1}</td>
									<td class="py-2 px-3">
										<div class="flex items-center gap-2">
											<span class="font-mono text-indigo-100">{limit.price}</span>
											<button
												type="button"
											on:click={() => copyToClipboard(limit.price)}
											class="text-xs px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/20 transition"
												title="Copy price"
											>
											{#if copiedValue === limit.price}
												<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
													</svg>
												{/if}
											</button>
										</div>
									</td>
									<td class="py-2 px-3">
										<div class="flex items-center gap-2">
											<span class="font-mono text-indigo-200">${limit.margin}</span>
											<button
												type="button"
												on:click={() => copyToClipboard(limit.margin)}
												class="text-xs px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/20 transition"
												title="Copy margin"
											>
											{#if copiedValue === limit.margin}
												<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
													</svg>
												{/if}
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- STOP -->
				<div>
					<h3 class="text-sm font-semibold mb-3 neon-text">Stop</h3>
					<table class="w-full text-sm border-collapse">
						<tbody>
							<tr class="border-b border-indigo-500/20">
								<td class="py-2 pr-4 font-medium text-indigo-300">Stop price</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono text-indigo-100">{result.stop_price}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.stop_price)}
											class="text-xs px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/20 transition"
											title="Copy stop price"
										>
											{#if copiedValue === result?.stop_price}
												<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
												</svg>
											{/if}
										</button>
									</div>
								</td>
							</tr>
							<tr>
								<td class="py-2 pr-4 font-medium text-red-400">Risk</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono text-red-400">-${result.stop_usd}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.stop_usd)}
											class="text-xs px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/20 transition"
											title="Copy risk amount"
										>
											{#if copiedValue === result?.stop_usd}
												<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
												</svg>
											{/if}
										</button>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<!-- TAKE PROFITS -->
				<div>
					<h3 class="text-sm font-semibold mb-3 neon-text">Take Profits</h3>
					<table class="w-full text-sm border-collapse">
						<thead>
							<tr class="border-b border-indigo-500/30 bg-indigo-500/10">
								<th class="text-left py-2 px-3 font-medium text-indigo-300">Level</th>
								<th class="text-left py-2 px-3 font-medium text-indigo-300">Price</th>
								<th class="text-left py-2 px-3 font-medium text-indigo-300">Move %</th>
								<th class="text-left py-2 px-3 font-medium text-indigo-300">Profit</th>
							</tr>
						</thead>
						<tbody>
							{#each result.takes as tp}
								<tr class="border-b border-indigo-500/20">
									<td class="py-2 px-3 text-indigo-200">TP{tp.level}</td>
									<td class="py-2 px-3">
										<div class="flex items-center gap-2">
											<span class="font-mono text-indigo-100">{tp.price}</span>
											<button
												type="button"
											on:click={() => copyToClipboard(tp.price)}
											class="text-xs px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/20 transition"
												title="Copy price"
											>
											{#if copiedValue === tp.price}
												<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
													</svg>
												{/if}
											</button>
										</div>
									</td>
									<td class="py-2 px-3 text-indigo-200">{tp.move_pct}%</td>
									<td class="py-2 px-3">
										<div class="flex items-center gap-2">
											<span class="font-mono text-green-400">+${tp.usd}</span>
											<button
												type="button"
											on:click={() => copyToClipboard(tp.usd)}
											class="text-xs px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/20 transition"
												title="Copy profit"
											>
											{#if copiedValue === tp.usd}
												<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
													</svg>
												{/if}
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

