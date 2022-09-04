export default {
  progressWindowIcon: {
    success: "chrome://zotero/skin/tick.png",
    fail: "chrome://zotero/skin/cross.png",
  },
  showProgressWindow: function (header, context, type = "success", t = 5000) {
    // Zotero.ZoteroTag.progressWindow.close();
    let progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
    progressWindow.changeHeadline(header);
    progressWindow.progress = new progressWindow.ItemProgress(
      Zotero.ZoteroTag.progressWindowIcon[type],
      context
    );
    progressWindow.show();
    if (t > 0) {
      progressWindow.startCloseTimer(t);
    }
    return progressWindow;
  },
  changeProgressWindowDescription(progressWindow, context) {
    if (!progressWindow || progressWindow.closed) {
      return;
    }
    progressWindow.progress._itemText.innerHTML = context;
  },
};
