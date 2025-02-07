const jq_throttle = function (delay, no_trailing, callback, debounce_mode) {
	var timeout_id,
		last_exec = 0;
	if (typeof no_trailing !== "boolean") {
		debounce_mode = callback;
		callback = no_trailing;
		no_trailing = undefined;
	}
	function wrapper() {
		return new Promise((res, rej) => {
			var that = this,
				elapsed = +new Date() - last_exec,
				args = arguments;
			function exec() {
				last_exec = +new Date();
				return callback.apply(that, args);
			}
			function clear() {
				timeout_id = undefined;
			}
			if (debounce_mode && !timeout_id) {
				return res(exec());
			}
			timeout_id && clearTimeout(timeout_id);
			if (debounce_mode === undefined && elapsed > delay) {
				return res(exec());
			} else if (no_trailing !== true) {
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

const debounce = function (delay, at_begin, callback) {
	console.assert(callback !== null, "Callback is null");
	return jq_throttle(delay, callback, at_begin !== false);
};
const keepUniqueOrdered = (arr) => {
	return [...new Set(arr.map(JSON.stringify))].map(JSON.parse);
};
