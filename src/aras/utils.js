function getUrlFromFileId(aras, fileId) {
    let file = aras.IomInnovator.newItem("File", "get");
    file.setAttribute("id", fileId);
    file = file.apply();
    return aras.vault.vault.makeFileDownloadUrl(aras.getFileURLEx(file.node));
}
