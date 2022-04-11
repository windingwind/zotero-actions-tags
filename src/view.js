export default {
  progressWindowIcon: {
    success: "chrome://zotero/skin/tick.png",
    fail: "chrome://zotero/skin/cross.png",
  },
  showProgressWindow: function (header, context, type = "success") {
    // Zotero.ZoteroTag.progressWindow.close();
    let progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
    progressWindow.changeHeadline(header);
    progressWindow.progress = new progressWindow.ItemProgress(
      Zotero.ZoteroTag.progressWindowIcon[type],
      context
    );
    progressWindow.show();
    progressWindow.startCloseTimer(5000);
  },
};
