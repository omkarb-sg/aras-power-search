interface ArasItem {
	getProperty(name: string): string;
	getPropertyItem(name: string): ArasItem | null;
	getPropertyAttribute(name: string, attribute: string): string;
	getAttribute(name: string): string;
	setAttribute(name: string, value: string): void;
	setProperty(name: string, value: string): void;
	apply(): ArasItem;
	getID(): string;
	getType(): string;
	isError(): boolean;
	getErrorString(): string;
	node: Node;
}

interface ArasItemCollection {
	getItemCount(): number;
	getItemByIndex(index: number): ArasItem;
	isError(): boolean;
	getErrorString(): string;
}

interface ArasInnovator {
	applyAML(aml: string): ArasItemCollection;
	newItem(type: string, action: string): ArasItem;
}

interface ArasOAuthClient {
	getAuthorizationHeader(): { Authorization: string };
}

interface ArasGlobal {
	IomInnovator: ArasInnovator;
	OAuthClient: ArasOAuthClient;
	vault: {
		vault: {
			makeFileDownloadUrl(url: string): string;
		};
	};
	getFileURLEx(node: Node): string;
	getServerURL(): string;
	getDatabase(): string;
	uiShowItem(itemTypeName: string, id: string): void;
	uiShowItemEx(node: Node): void;
	AlertSuccess(message: string): void;
	AlertError(message: string): void;
	getIsAliasIdentityIDForLoggedUser(): string;
	getItemTypeForClient(name: string, lookupBy: string): ArasItem;
}

interface ArasTabsGlobal {
	openSearch(configId: string, favoriteId?: string): void;
	tabs?: string[];
	selectTab(tabId: string): void;
}

interface ArasSearchContainer {
	itemTypeName: string;
}

interface DependenciesGlobal {
	view(
		itemTypeName: string,
		itemConfigId: string,
		includeRelated: boolean,
		aras: ArasGlobal,
	): void;
}

interface Window {
	aras?: ArasGlobal;
	arasTabs?: ArasTabsGlobal;
	Dependencies?: DependenciesGlobal;
	thisItem?: ArasItem;
	searchContainer?: ArasSearchContainer;
}
