function getUrlFromFileId(aras, fileId) {
	let file = aras.IomInnovator.newItem("File", "get");
	file.setAttribute("id", fileId);
	file = file.apply();
	if (file.isError()) return null;

	try {
		const url = aras.vault.vault.makeFileDownloadUrl(
			aras.getFileURLEx(file.node),
		);
		return url;
	} catch (e) {
		return null;
	}
}
