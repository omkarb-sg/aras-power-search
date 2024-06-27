const StorageDependency = LocalStorage;

/**
 * @type {LocalStorage}
 */
const storage = new StorageDependency(window.top || window);

// Feel free to rename these
function _set(key, value) {
	storage.set(key, value, true);
}

function _get(key) {
	return storage.get(key, true);
}
