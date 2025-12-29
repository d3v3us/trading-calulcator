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

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<h2 class="text-2xl font-semibold mb-6 text-center">Trade Calculator · 3 TP</h2>
		
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- LEFT: FORM -->
			<div class="rounded-2xl border bg-white p-6 shadow-sm">
				<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="text-sm font-medium">Deposit ($)</label>
				<input
					type="number"
					bind:value={deposit}
					class="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
				/>
			</div>

			<div>
				<label class="text-sm font-medium">Direction</label>
				<select
					bind:value={direction}
					class="mt-1 w-full rounded-md border px-3 py-2 text-sm"
				>
					<option value="long">Long</option>
					<option value="short">Short</option>
				</select>
			</div>

			<div>
				<label class="text-sm font-medium">Current price</label>
				<input
					type="number"
					step="0.000001"
					bind:value={currentPrice}
					class="mt-1 w-full rounded-md border px-3 py-2 text-sm"
				/>
			</div>

			<div>
				<label class="text-sm font-medium">Leverage</label>
				<div class="flex items-center gap-2">
					<select
						bind:value={leverage}
						class="mt-1 flex-1 rounded-md border px-3 py-2 text-sm"
					>
						{#each leverageOptions as option}
							<option value={option}>{option}x</option>
						{/each}
					</select>
					<div class="mt-1 text-2xl">
						{getLeverageEmotion(leverage)}
					</div>
				</div>
				{#if true}
					{@const message = getLeverageMessage(leverage)}
					{#if message.type === 'success'}
						<div class="mt-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
							{message.text}
						</div>
					{:else if message.type === 'warning'}
						<div class="mt-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
							{message.text}
						</div>
					{:else if message.type === 'danger'}
						<div class="mt-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
							{message.text}
						</div>
					{/if}
				{/if}
			</div>

			<div>
				<label class="text-sm font-medium">Deposit Risk (%)</label>
				<div class="mt-1 w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
					{depositRisk.toFixed(2)}%
				</div>
				<p class="mt-1 text-xs text-gray-500">Auto-calculated from leverage</p>
			</div>

			<div>
				<label class="text-sm font-medium">Limits count</label>
				<select
					bind:value={numLimits}
					class="mt-1 w-full rounded-md border px-3 py-2 text-sm"
				>
					<option value={0}>0</option>
					<option value={1}>1</option>
					<option value={2}>2</option>
					<option value={3}>3</option>
				</select>
			</div>

			<div class="col-span-2">
				<label class="text-sm font-medium">Limit style</label>
				<select
					bind:value={limitStyle}
					class="mt-1 w-full rounded-md border px-3 py-2 text-sm"
				>
					<option value="aggressive">Aggressive</option>
					<option value="equal">Equal</option>
					<option value="moderate">Moderate</option>
				</select>
			</div>
				</div>

				<button
					type="button"
					on:click={handleCalculate}
					disabled={isLoading}
					class="mt-6 w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
					<div class="rounded-2xl border bg-white p-6 shadow-sm flex items-center justify-center py-12">
						<Loader size="md" />
					</div>
				{:else if showOutput && result && !isLoading}
					<div class="rounded-2xl border bg-white p-6 shadow-sm space-y-6 table-animate">
						<!-- SUMMARY -->
				<div>
					<h3 class="text-sm font-semibold mb-3">Summary</h3>
					<table class="w-full text-sm border-collapse">
						<tbody>
							<tr class="border-b">
								<td class="py-2 pr-4 font-medium">Margin</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono">${result.margin}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.margin)}
											class="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
											title="Copy margin"
										>
											{#if copiedValue === result?.margin}
												<svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
												</svg>
											{/if}
										</button>
									</div>
								</td>
							</tr>
							<tr class="border-b">
								<td class="py-2 pr-4 font-medium">Position</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono">${result.position}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.position)}
											class="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
											title="Copy position"
										>
											{#if copiedValue === result?.position}
												<svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
												</svg>
											{/if}
										</button>
									</div>
								</td>
							</tr>
							<tr>
								<td class="py-2 pr-4 font-medium">Entry price</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono">{result.entry_price}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.entry_price)}
											class="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
											title="Copy entry price"
										>
											{#if copiedValue === result?.entry_price}
												<svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
					<h3 class="text-sm font-semibold mb-3">Entries</h3>
					<table class="w-full text-sm border-collapse">
						<thead>
							<tr class="border-b bg-gray-50">
								<th class="text-left py-2 px-3 font-medium">#</th>
								<th class="text-left py-2 px-3 font-medium">Price</th>
								<th class="text-left py-2 px-3 font-medium">Margin</th>
							</tr>
						</thead>
						<tbody>
							{#each result.limits as limit, i}
								<tr class="border-b">
									<td class="py-2 px-3">{i + 1}</td>
									<td class="py-2 px-3">
										<div class="flex items-center gap-2">
											<span class="font-mono">{limit.price}</span>
											<button
												type="button"
												on:click={() => copyToClipboard(limit.price)}
												class="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
												title="Copy price"
											>
												{#if copiedValue === limit.price}
													<svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
													</svg>
												{:else}
													<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
													</svg>
												{/if}
											</button>
										</div>
									</td>
									<td class="py-2 px-3">
										<div class="flex items-center gap-2">
											<span class="font-mono text-neutral-500">${limit.margin}</span>
											<button
												type="button"
												on:click={() => copyToClipboard(limit.margin)}
												class="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
												title="Copy margin"
											>
												{#if copiedValue === limit.margin}
													<svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
													</svg>
												{:else}
													<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
					<h3 class="text-sm font-semibold mb-3">Stop</h3>
					<table class="w-full text-sm border-collapse">
						<tbody>
							<tr class="border-b">
								<td class="py-2 pr-4 font-medium">Stop price</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono">{result.stop_price}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.stop_price)}
											class="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
											title="Copy stop price"
										>
											{#if copiedValue === result?.stop_price}
												<svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
												</svg>
											{/if}
										</button>
									</div>
								</td>
							</tr>
							<tr>
								<td class="py-2 pr-4 font-medium text-red-600">Risk</td>
								<td class="py-2">
									<div class="flex items-center gap-2">
										<span class="font-mono text-red-600">-${result.stop_usd}</span>
										<button
											type="button"
											on:click={() => result && copyToClipboard(result.stop_usd)}
											class="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
											title="Copy risk amount"
										>
											{#if copiedValue === result?.stop_usd}
												<svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
												</svg>
											{:else}
												<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
					<h3 class="text-sm font-semibold mb-3">Take Profits</h3>
					<table class="w-full text-sm border-collapse">
						<thead>
							<tr class="border-b bg-gray-50">
								<th class="text-left py-2 px-3 font-medium">Level</th>
								<th class="text-left py-2 px-3 font-medium">Price</th>
								<th class="text-left py-2 px-3 font-medium">Move %</th>
								<th class="text-left py-2 px-3 font-medium">Profit</th>
							</tr>
						</thead>
						<tbody>
							{#each result.takes as tp}
								<tr class="border-b">
									<td class="py-2 px-3">TP{tp.level}</td>
									<td class="py-2 px-3">
										<div class="flex items-center gap-2">
											<span class="font-mono">{tp.price}</span>
											<button
												type="button"
												on:click={() => copyToClipboard(tp.price)}
												class="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
												title="Copy price"
											>
												{#if copiedValue === tp.price}
													<svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
													</svg>
												{:else}
													<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
													</svg>
												{/if}
											</button>
										</div>
									</td>
									<td class="py-2 px-3">{tp.move_pct}%</td>
									<td class="py-2 px-3">
										<div class="flex items-center gap-2">
											<span class="font-mono text-green-600">+${tp.usd}</span>
											<button
												type="button"
												on:click={() => copyToClipboard(tp.usd)}
												class="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
												title="Copy profit"
											>
												{#if copiedValue === tp.usd}
													<svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
													</svg>
												{:else}
													<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

