<script lang="ts">
	import { calculateTrade3TP, type Direction, type LimitStyle, type TradeCalculationResult } from '$lib/calculateTrade';
	import Loader from '$lib/Loader.svelte';

	let deposit = 1290;
	let direction: Direction = 'short';
	let currentPrice = 0.466;
	let numLimits = 2;
	let limitStyle: LimitStyle = 'aggressive';

	let result: TradeCalculationResult | null = null;
	let showOutput = false;
	let isLoading = false;

	async function handleCalculate(): Promise<void> {
		isLoading = true;
		showOutput = false;

		// Small delay to show loader (calculation is instant, so we add a brief delay for UX)
		await new Promise(resolve => setTimeout(resolve, 300));

		const calculationResult = calculateTrade3TP({
			deposit,
			direction,
			current_price: currentPrice,
			num_limits: numLimits,
			limit_style: limitStyle
		});

		result = calculationResult;
		showOutput = true;
		isLoading = false;
	}

</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
	<div class="w-full max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
		<h2 class="text-xl font-semibold mb-6">Trade Calculator · 3 TP</h2>

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

		{#if isLoading}
			<div class="mt-6 flex items-center justify-center py-12">
				<Loader size="md" />
			</div>
		{/if}

		{#if showOutput && result && !isLoading}
			<div class="mt-6 rounded-2xl border bg-white p-6 shadow-sm space-y-6">
				<!-- SUMMARY -->
				<div>
					<h3 class="text-sm font-semibold mb-2">Summary</h3>
					<div class="grid grid-cols-2 gap-3 text-sm">
						<div>
							Margin: <span class="font-medium">${result.margin}</span>
						</div>
						<div>
							Position: <span class="font-medium">${result.position}</span>
						</div>
						<div>
							Entry price: <span class="font-medium">{result.entry_price}</span>
						</div>
					</div>
				</div>

				<!-- ENTRIES -->
				<div>
					<h3 class="text-sm font-semibold mb-2">Entries</h3>
					<div class="space-y-2 text-sm">
						{#each result.limits as limit, i}
							<div class="flex justify-between rounded-md border px-3 py-2">
								<span>#{i + 1}</span>
								<span>{limit.price}</span>
								<span class="text-neutral-500">${limit.margin}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- STOP -->
				<div>
					<h3 class="text-sm font-semibold mb-2">Stop</h3>
					<div class="flex justify-between text-sm">
						<span>Stop price</span>
						<span class="font-medium">{result.stop_price}</span>
					</div>
					<div class="flex justify-between text-sm text-red-600">
						<span>Risk</span>
						<span class="font-medium">-${result.stop_usd}</span>
					</div>
				</div>

				<!-- TAKE PROFITS -->
				<div>
					<h3 class="text-sm font-semibold mb-2">Take Profits</h3>
					<div class="space-y-2 text-sm">
						{#each result.takes as tp}
							<div class="flex justify-between rounded-md border px-3 py-2">
								<span>TP{tp.level}</span>
								<span>{tp.price}</span>
								<span class="text-green-600">+${tp.usd}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

