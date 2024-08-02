const StorageDependency = IndexedDB;
const storage = new StorageDependency(window.top || window);

// Feel free to rename these
async function aras_power_set(key, value) {
	await storage.set(key, value);
}

async function aras_power_get(key) {
	return await storage.get(key);
}
