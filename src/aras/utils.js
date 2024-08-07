function getUrlFromFileId(aras, fileId) {
	let file = aras.IomInnovator.newItem("File", "get");
	file.setAttribute("id", fileId);
	file = file.apply();
	if (file.isError()) return null;
	return aras.vault.vault.makeFileDownloadUrl(aras.getFileURLEx(file.node));
}

async function disableTOC(document) {
	try {
		const navButton = await waitForSelector(document, "#headerCommandsBar > div > button", 10_000);
		const tocElement = await waitForSelector(document, "aras-navigation-panel", 10_000);
		tocElement.style.pointerEvents = "none";
		navButton.style.display = "none";
		return true;
	} catch (e) {
		return false;
	}
}
