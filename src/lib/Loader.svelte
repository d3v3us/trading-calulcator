<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from "$lib/utils";
	
	export let className: string | undefined = undefined;
	export let size: "sm" | "md" | "lg" = "md";
	
	let selectedLoader: string | null = null;
	
	const loaders = [
		"spinner",
		"dots",
		"bars",
		"ripple",
		"ring",
		"hourglass",
		"roller",
		"ellipsis"
	];
	
	onMount(() => {
		// Randomly select a loader on mount
		const randomIndex = Math.floor(Math.random() * loaders.length);
		selectedLoader = loaders[randomIndex];
	});
	
	const sizeClasses = {
		sm: "scale-75",
		md: "scale-100",
		lg: "scale-125",
	};
</script>

{#if selectedLoader}
	<div class={cn("flex items-center justify-center", sizeClasses[size], className)}>
		{#if selectedLoader === "spinner"}
			<div class="loader"></div>
		{:else if selectedLoader === "dots"}
			<div class="loader-dots">
				<span></span>
				<span></span>
				<span></span>
			</div>
		{:else if selectedLoader === "bars"}
			<div class="loader-bars">
				<span></span>
				<span></span>
				<span></span>
				<span></span>
				<span></span>
			</div>
		{:else if selectedLoader === "ripple"}
			<div class="loader-ripple">
				<div></div>
				<div></div>
			</div>
		{:else if selectedLoader === "ring"}
			<div class="loader-ring">
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>
		{:else if selectedLoader === "hourglass"}
			<div class="loader-hourglass"></div>
		{:else if selectedLoader === "roller"}
			<div class="loader-roller">
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>
		{:else if selectedLoader === "ellipsis"}
			<div class="loader-ellipsis">
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>
		{/if}
	</div>
{/if}

