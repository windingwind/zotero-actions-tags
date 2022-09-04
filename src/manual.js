class CopyHelper {
  constructor() {
    this.transferable = Components.classes[
      "@mozilla.org/widget/transferable;1"
    ].createInstance(Components.interfaces.nsITransferable);
    this.clipboardService = Components.classes[
      "@mozilla.org/widget/clipboard;1"
    ].getService(Components.interfaces.nsIClipboard);
  }

  addText(source, type) {
    const str = Components.classes[
      "@mozilla.org/supports-string;1"
    ].createInstance(Components.interfaces.nsISupportsString);
    str.data = source;
    this.transferable.addDataFlavor(type);
    this.transferable.setTransferData(type, str, source.length * 2);
    return this;
  }

  addImage(source) {
    const io = Components.classes[
      "@mozilla.org/network/io-service;1"
    ].getService(Components.interfaces.nsIIOService);
    const channel = io.newChannel(source, null, null);
    const input = channel.open();
    const imgTools = Components.classes[
      "@mozilla.org/image/tools;1"
    ].getService(Components.interfaces.imgITools);

    const buffer = NetUtil.readInputStreamToString(input, input.available());
    const container = imgTools.decodeImageFromBuffer(
      buffer,
      buffer.length,
      channel.contentType
    );

    this.transferable.addDataFlavor(channel.contentType);
    this.transferable.setTransferData(channel.contentType, container, -1);
    return this;
  }

  copy() {
    this.clipboardService.setData(
      this.transferable,
      null,
      Components.interfaces.nsIClipboard.kGlobalClipboard
    );
  }
}

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
        const threshold = Number(
          prompt("Count tags used less than N times, default 5", "5")
        );
        this._window.focus();
        if (threshold <= 0) {
          return;
        }

        const tagsBox = _window.document.getElementById("manual-tags");
        let tags = [];
        let counts = {};
        let out = [];
        ZoteroPane.getSelectedCollection()
          .getChildItems()
          .forEach((item) => (tags = tags.concat(item.getTags())));
        tags.forEach((tag) =>
          counts[tag.tag] ? (counts[tag.tag] += 1) : (counts[tag.tag] = 1)
        );
        for (k of Object.keys(counts)) {
          if (counts[k] < threshold) {
            out.push(k);
          }
        }
        new CopyHelper().addText(out.join(","), "text/unicode").copy();
        tagsBox.value =
          (tagsBox.value.length ? tagsBox.value + "," : "") + out.join(",");
        Zotero.ZoteroTag.showProgressWindow(
          "Rarely Used Tags Copied",
          out.join(",")
        );
      }
    },
  },
};
