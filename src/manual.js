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

async function pick(title, mode, filters, suggestion) {
  const fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(
    Components.interfaces.nsIFilePicker
  );

  if (suggestion) fp.defaultString = suggestion;

  mode = {
    open: Components.interfaces.nsIFilePicker.modeOpen,
    save: Components.interfaces.nsIFilePicker.modeSave,
    folder: Components.interfaces.nsIFilePicker.modeGetFolder,
  }[mode];

  fp.init(window, title, mode);

  for (const [label, ext] of filters || []) {
    fp.appendFilter(label, ext);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return new Zotero.Promise((resolve) => {
    fp.open((userChoice) => {
      switch (userChoice) {
        case Components.interfaces.nsIFilePicker.returnOK:
        case Components.interfaces.nsIFilePicker.returnReplace:
          let filename = fp.file.path;
          filename = filename.replace(/\\/g, "/");
          filename = OS.Path.join(...filename.split(/\//));
          if (!Zotero.isWin && filename.charAt(0) !== "/") {
            filename = "/" + filename;
          }
          resolve(filename);
          break;

        default: // aka returnCancel
          resolve("");
          break;
      }
    });
  });
}

export default {
  manual: {
    io: {},
    _window: undefined,
    doLoad: function (_window) {
      if (this._window && !this._window.closed) {
        this._window.close();
      }
      this._window = _window;
      this.io = _window.arguments[0];
      console.log(this.io);
      const userTag = Zotero.Prefs.get("zoterotag.usertag", false);
      _window.document.getElementById("manual-usertag").checked = userTag;
      if (this.io.dataIn.isCollection) {
        _window.document
          .getElementById("manual-includesub")
          .removeAttribute("hidden");
      }
    },
    doAccept: function (_window) {
      const tags = _window.document
        .getElementById("manual-tags")
        .value.split(",")
        .filter((tag) => tag);
      const op = _window.document
        .getElementById("manual-operation")
        .getAttribute("value");
      const userTag = _window.document.getElementById("manual-usertag").checked;
      const includeSubCollections =
        _window.document.getElementById("manual-includesub").checked;
      Zotero.Prefs.set("zoterotag.usertag", userTag);
      console.log(tags);
      this.io.dataOut.operation = op;
      this.io.dataOut.tags = tags;
      this.io.dataOut.userTag = userTag;
      this.io.dataOut.includeSubCollections = includeSubCollections;
    },
    doUnload: function () {
      this.io.deferred && this.io.deferred.resolve();
    },
    doUpdate: async function (_window, type) {
      let items = [];
      const selectedCollection = ZoteroPane.getSelectedCollection();
      if (selectedCollection) {
        items = Zotero.ZoteroTag.getChildItemsRecursively(
          selectedCollection,
          _window.document.getElementById("manual-includesub").checked
        );
      } else {
        items = await Zotero.Items.getAll(ZoteroPane.getSelectedLibraryID());
      }
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
        items.forEach((item) => (tags = tags.concat(item.getTags())));
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
      } else if (type === "export") {
        const date = new Date();
        let filename = await pick(
          "Export Tags",
          "save",
          [["CSV (Comma delimited)", "*.csv"]],
          `tags_${
            selectedCollection
              ? selectedCollection.name
              : Zotero.Libraries.getName(ZoteroPane.getSelectedLibraryID())
          }_${date.getFullYear()}${String(date.getMonth()).padStart(
            2,
            "0"
          )}${String(date.getDate()).padStart(2, "0")}${String(
            date.getHours()
          ).padStart(2, "0")}_${String(date.getSeconds()).padStart(2, "0")}.csv`
        );
        if (!filename) {
          return;
        }
        _window.focus();
        const progress = Zotero.ZoteroTag.showProgressWindow(
          "[Pending] Zotero Tag",
          `Parsing ${items.length} items`,
          "success",
          -1
        );
        let t = 0;
        // Wait for ready
        while (!progress.progress._itemText && t < 100) {
          t += 1;
          await Zotero.Promise.delay(10);
        }
        progress.progress.setProgress(30);
        let res = {};
        items.forEach((item) => {
          item.getTags().forEach((tag) => {
            {
              res[tag.tag]
                ? (res[tag.tag].count += 1)
                : (res[tag.tag] = {
                    count: 1,
                    itemNames: [],
                    ids: [],
                  });
              res[tag.tag].itemNames.push(item.getField("title"));
              res[tag.tag].ids.push(item.id);
            }
          });
        });
        if (progress) {
          progress.progress.setProgress(60);
          Zotero.ZoteroTag.changeProgressWindowDescription(
            progress,
            `Found ${res.length} tags. Exporting file...`
          );
        }
        let content = "TAG,COUNT,ITEMS,IDS\n";
        for (k of Object.keys(res)) {
          content += `${k.replace(/,/g, "$COMMA$")},${res[k].count},"${res[
            k
          ].itemNames
            .map((i) => i.replace(/,/g, "$COMMA$"))
            .join(",")}","${res[k].ids.join(",")}"\n`;
        }
        await Zotero.File.putContentsAsync(filename, content);
        if (progress) {
          progress.progress.setProgress(100);
          progress.changeHeadline("[Done] Zotero Tag");
          Zotero.ZoteroTag.changeProgressWindowDescription(
            progress,
            `Export to ${filename}.`
          );
          progress.startCloseTimer(5000);
        }
      } else if (type === "import") {
        let filename = await pick("Import Tags", "open", [
          ["CSV (Comma delimited)", "*.csv"],
          ["Any", "*"],
        ]);
        if (!filename) {
          return;
        }
        _window.focus();
        const content = await Zotero.File.getContentsAsync(filename);
        const importRules = [];
        // Array<{type: }>
        content
          .replace(/\r/g, "")
          .split("\n")
          .filter((line) => line)
          .forEach((line) => {
            const splittedLine = line.split(",");
            if (splittedLine.length < 3) {
              return;
            }
            const actionType = splittedLine[0];
            const targetTag = splittedLine[1].replace(/\$COMMA\$/g, ",");
            const matchTagsList = splittedLine
              .slice(2)
              .filter((t) => t)
              .map((t) => t.replace(/\$COMMA\$/g, ","));
            if (actionType === "+") {
              importRules.push((item, userTag) => {
                console.log("add", matchTagsList, targetTag);
                if (matchTagsList.length === 0) {
                  item.addTag(targetTag, userTag ? 0 : 1);
                } else {
                  for (const matchTag of matchTagsList) {
                    if (item.hasTag(matchTag)) {
                      item.addTag(targetTag, userTag ? 0 : 1);
                      break;
                    }
                  }
                }
              });
            } else if (actionType === "-") {
              importRules.push((item, userTag) => {
                console.log("remove", matchTagsList, targetTag);
                if (matchTagsList.length === 0) {
                  item.removeTag(targetTag, userTag ? 0 : 1);
                } else {
                  for (const matchTag of matchTagsList) {
                    if (item.hasTag(matchTag)) {
                      item.removeTag(targetTag);
                      break;
                    }
                  }
                }
              });
            } else if (actionType === "=") {
              importRules.push((item, userTag) => {
                console.log("replace", matchTagsList, targetTag);
                if (matchTagsList.length === 0) {
                  return;
                } else {
                  for (const matchTag of matchTagsList) {
                    if (item.hasTag(matchTag)) {
                      item.addTag(targetTag, userTag ? 0 : 1);
                    }
                    item.removeTag(matchTag);
                  }
                }
              });
            }
          });
        console.log(importRules);
        Zotero.ZoteroTag.updateItems(
          items,
          "custom",
          importRules,
          _window.document.getElementById("manual-usertag").checked
        );
      }
    },
  },
};
