export function cn(...inputs: (string | undefined | null | boolean)[]): string {
	return inputs
		.filter(Boolean)
		.join(' ')
		.split(/\s+/)
		.filter((cls, index, arr) => arr.indexOf(cls) === index)
		.join(' ');
}

