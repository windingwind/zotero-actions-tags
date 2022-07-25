export default {
  manual: {
    io: {},
    _window: undefined,
    doLoad: function (_window) {
      let that = Zotero.ZoteroTag.manual;
      if (that._window && !that._window.closed) {
        that._window.close();
      }
      that._window = _window;
      that.io = _window.arguments[0];
      const userTag = Zotero.Prefs.get("zoterotag.usertag", false);
      _window.document.getElementById("manual-usertag").checked = userTag;
    },
    doAccept: function (_window) {
      const tags = _window.document
        .getElementById("manual-tags")
        .value.split(",");
      const op = _window.document
        .getElementById("manual-operation")
        .getAttribute("value");
      const userTag = _window.document.getElementById("manual-usertag").checked;
      Zotero.Prefs.set("zoterotag.usertag", userTag);
      console.log(tags);
      this.io.dataOut.operation = op;
      this.io.dataOut.tags = tags;
      this.io.dataOut.userTag = userTag;
    },
    doUnload: function () {
      this.io.deferred && this.io.deferred.resolve();
    },
    doUpdate: function (_window, type) {
      if (type === "unused") {
        const tagsBox = _window.document.getElementById("manual-tags");
      }
    },
  },
};
