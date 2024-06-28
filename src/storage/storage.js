const StorageDependency = IndexedDB;
const storage = new StorageDependency(window.top || window);

// Feel free to rename these
async function _set(key, value) {
	await storage.set(key, value);
}

async function _get(key) {
	return await storage.get(key);
}
