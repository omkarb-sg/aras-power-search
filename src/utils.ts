export const jq_throttle = function <TArgs extends unknown[]>(
	delay: number,
	no_trailing: boolean | ((...args: TArgs) => unknown),
	callback?: (...args: TArgs) => unknown,
	debounce_mode?: boolean,
) {
	let timeout_id: ReturnType<typeof setTimeout> | undefined;
	let last_exec = 0;

	if (typeof no_trailing !== "boolean") {
		debounce_mode = callback as boolean | undefined;
		callback = no_trailing;
		no_trailing = undefined as unknown as boolean;
	}

	function wrapper(this: unknown, ...args: TArgs) {
		return new Promise((res) => {
			const that = this;
			const elapsed = +new Date() - last_exec;
			const cb = callback as (...callbackArgs: TArgs) => unknown;

			function exec() {
				last_exec = +new Date();
				return cb.apply(that, args);
			}

			function clear() {
				timeout_id = undefined;
			}

			if (debounce_mode && !timeout_id) {
				res(exec());
				return;
			}

			if (timeout_id) {
				clearTimeout(timeout_id);
			}

			if (debounce_mode === undefined && elapsed > delay) {
				res(exec());
				return;
			}

			if (no_trailing !== true) {
				timeout_id = setTimeout(
					debounce_mode
						? clear
						: () => {
								res(exec());
							},
					debounce_mode === undefined ? delay - elapsed : delay,
				);
			}
		});
	}

	return wrapper;
};

export const debounce = function <TArgs extends unknown[]>(
	delay: number,
	at_begin: boolean,
	callback: (...args: TArgs) => unknown,
) {
	console.assert(callback !== null, "Callback is null");
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	return (...args: TArgs) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		if (at_begin && !timeoutId) {
			callback(...args);
		}

		timeoutId = setTimeout(() => {
			if (!at_begin) {
				callback(...args);
			}
			timeoutId = undefined;
		}, delay);
	};
};

export const keepUniqueOrdered = <T>(
	arr: T[],
	serialize: (item: T) => string = (item) => JSON.stringify(item),
) => {
	const seen = new Set<string>();
	return arr.filter((item) => {
		const serialized = serialize(item);
		if (seen.has(serialized)) {
			return false;
		}
		seen.add(serialized);
		return true;
	});
};
