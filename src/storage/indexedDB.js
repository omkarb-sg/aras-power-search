class IndexedDB {
	/**
	 *
	 * @param {Window} window
	 */
	constructor(window) {
		/**
		 * @type {Window}
		 */
		this.window = window;
		/**
		 * @type {IDBDatabase}
		 */
		this.db = null;
		this.start();
	}

	// Private methods
	async start() {
		this.db = await new Promise((res, rej) => {
			const open_request = this.window.indexedDB.open("_aras_power_search");
			open_request.onsuccess = (event) => {
				res(event.target.result);
			};
			open_request.onupgradeneeded = async (event) => {
				const db = event.target.result;
				this.createObjectStore(db, "table", { keyPath: "key" }, [
					{ name: "key", keyPath: "key", options: { unique: true } },
					{ name: "value", keyPath: "value", options: { unique: false } },
				]);
				// this.itemtypesObjectStore = this.createObjectStore(db, "itemtypes", { keyPath: "itemtypename" }, [
				// 	{ name: "itemtypename", keyPath: "itemtypename", options: { unique: true } },
				// 	{ name: "items", keyPath: "items" },
				// ]);
				// this.itemtypesObjectStore = this.createObjectStore(
				// 	db,
				// 	"lastfetched",
				// 	{ keyPath: "itemtypename" },
				// 	[
				// 		{ name: "itemtypename", keyPath: "itemtypename", options: { unique: true } },
				// 		{ name: "fetchedat", keyPath: "fetchedat" },
				// 	]
				// );
			};
			open_request.onerror = rej;
		});

		return this;
	}

	/**
	 * @typedef {Object} IndexInfo
	 * @property {string} name
	 * @property {string | Iterable<string>} keyPath
	 * @property {IDBIndexParameters | undefined} options
	 */

	/**
	 *
	 * @param {IDBDatabase} db
	 * @param {string} name
	 * @param {IDBObjectStoreParameters | undefined} options
	 * @param {IndexInfo[]} indexes
	 * @returns {Promise<IDBObjectStore>}
	 */
	async createObjectStore(db, name, options, indexes) {
		return await new Promise((res, rej) => {
			const objectStore = db.createObjectStore(name, options);
			for (const indexInfo of indexes) {
				objectStore.createIndex(indexInfo.name, indexInfo.keyPath, indexInfo.options);
			}
			objectStore.transaction.oncomplete = () => res(objectStore);
			objectStore.transaction.onabort = rej;
			objectStore.transaction.onerror = rej;
		});
	}

	async waitForDb() {
		return new Promise((res, rej) => {
			const interval = setInterval(() => {
				if (this.db != null) {
					clearInterval(interval);
					res(this.db);
				}
			}, 100);
		});
	}

	// Public methods
	async get(key) {
		if (this.db == null) await this.waitForDb();
        const transaction = this.db.transaction("table", "readonly");
        const tableStore = transaction.objectStore("table");
        const request = tableStore.get(key);
        const result = await new Promise((res, rej) => {
            request.onsuccess = (event) => res(request.result);
            request.onerror = rej;
        });
        return result;
	}

	async set(key, value) {
		if (this.db == null) await this.waitForDb();
        const transaction = this.db.transaction("table", "readwrite");
        const tableStore = transaction.objectStore("table");
        const request = tableStore.add({ key, value });
        const result = await new Promise((res, rej) => {
            request.onsuccess = (event) => res(true);
            request.onerror = rej;
        });
        return result;
	}

	async clear() {
		if (this.db == null) await this.waitForDb();
	}

	async remove() {
		if (this.db == null) await this.waitForDb();
	}
}

