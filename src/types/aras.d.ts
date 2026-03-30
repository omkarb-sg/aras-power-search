interface ArasItem {
	getProperty(name: string): string;
	getPropertyAttribute(name: string, attribute: string): string;
	setAttribute(name: string, value: string): void;
	setProperty(name: string, value: string): void;
	apply(): ArasItem;
	getID(): string;
	isError(): boolean;
	node: Node;
}

interface ArasItemCollection {
	getItemCount(): number;
	getItemByIndex(index: number): ArasItem;
}

interface ArasInnovator {
	applyAML(aml: string): ArasItemCollection;
	newItem(type: string, action: string): ArasItem;
}

interface ArasGlobal {
	IomInnovator: ArasInnovator;
	vault: {
		vault: {
			makeFileDownloadUrl(url: string): string;
		};
	};
	getFileURLEx(node: Node): string;
	uiShowItem(itemTypeName: string, id: string): void;
	uiShowItemEx(node: Node): void;
	AlertSuccess(message: string): void;
}

interface ArasTabsGlobal {
	openSearch(configId: string): void;
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
}
