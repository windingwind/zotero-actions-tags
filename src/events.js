export default {
  version: 12,
  versionInfo: "New Feature: Remove after read. Please check Preference.",

  init: function () {
    Zotero.ZoteroTag.checkVersion();
    Zotero.ZoteroTag.resetState();
    // Zotero.ZoteroTag.tag_name();
    // Zotero.ZoteroTag.automatic_add_tag();
    Zotero.ZoteroTag.rules();

    // Register the callback in Zotero as an item observer
    var itemNotifierID = Zotero.Notifier.registerObserver(
      Zotero.ZoteroTag.itemNotifierCallback,
      ["item"]
    );
    var fileNotifierID = Zotero.Notifier.registerObserver(
      Zotero.ZoteroTag.fileNotifierCallback,
      ["file"]
    );

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener(
      "unload",
      function (e) {
        Zotero.Notifier.unregisterObserver(itemNotifierID);
        Zotero.Notifier.unregisterObserver(fileNotifierID);
      },
      false
    );

    Zotero.ZoteroTag.initKeys();
  },
  itemNotifierCallback: {
    // Adds pdfs when new item is added to zotero.
    notify: function (event, type, ids, extraData) {
      Zotero.debug("ZoteroTag: add items when event == add");
      if (event == "add" && type == "item") {
        Zotero.debug("ZoteroTag: first try");
        Zotero.ZoteroTag.updateItems(
          Zotero.Items.get(ids).filter((item) => item.isRegularItem()),
          "add",
          Zotero.ZoteroTag.getTagByAuto()
        );
      }
    },
  },
  fileNotifierCallback: {
    notify: function (event, type, ids, extraData) {
      Zotero.debug("ZoteroTag: remove tags when event == open");
      if (event == "open" && type == "file") {
        Zotero.debug("ZoteroTag: file open detected.");
        Zotero.ZoteroTag.updateItems(
          Zotero.Items.get(ids)
            .map((item, index, arr) => item.parentItem)
            .filter((item) => item.isRegularItem()),
          "remove",
          Zotero.ZoteroTag.getTagByRead()
        );
      }
    },
  },
  initKeys: function () {
    let shortcuts = [];
    // init shortcuts
    for (let i = 0; i <= 9; i++) {
      shortcuts.push({
        id: String(i + 10),
        operation: "change",
        group: i,
        modifiers: "alt",
        key: String(i),
      });
    }
    let keyset = document.createElement("keyset");
    keyset.setAttribute("id", "zoterotag-keyset");

    for (let i in shortcuts) {
      keyset.appendChild(Zotero.ZoteroTag.createKey(shortcuts[i]));
    }
    document.getElementById("mainKeyset").parentNode.appendChild(keyset);
  },
  createKey: function (keyObj) {
    let key = document.createElement("key");
    key.setAttribute("id", "zoterotag-key-" + keyObj.id);
    key.setAttribute("oncommand", "//");
    key.addEventListener("command", function () {
      try {
        Zotero.ZoteroTag.updateSelectedItems(keyObj.operation, keyObj.group);
      } catch (error) {
        Zotero.ZoteroTag.showProgressWindow(
          "ERROR",
          "Zotero Tag: Fail to add/remove tags.",
          "fail"
        );
      }
    });

    if (keyObj.modifiers) {
      key.setAttribute("modifiers", keyObj.modifiers);
    }
    if (keyObj.key) {
      key.setAttribute("key", keyObj.key);
    } else if (keyObj.keycode) {
      key.setAttribute("keycode", keyObj.keycode);
    } else {
      // No key or keycode.  Set to empty string to disable.
      key.setAttribute("key", "");
    }
    return key;
  },
  resetState: function () {
    // Reset state for updating items.
    Zotero.ZoteroTag.current = -1;
    Zotero.ZoteroTag.toUpdate = 0;
    Zotero.ZoteroTag.itemsToUpdate = null;
    Zotero.ZoteroTag.numberOfUpdatedItems = 0;
  },

  versionOpt: function () {
    let _rules = Zotero.ZoteroTag.rules();
    for (let i = 0; i < _rules.length; i++) {
      _rules[i].autoremove = _rules[i].autoadd;
    }
    Zotero.ZoteroTag.resetRules(_rules);
  },
  checkVersion: function () {
    let _version = Zotero.Prefs.get("zoterotag.version");
    if (
      typeof _version === "undefined" ||
      _version < Zotero.ZoteroTag.version
    ) {
      Zotero.Prefs.set("zoterotag.version", Zotero.ZoteroTag.version);
      Zotero.ZoteroTag.showProgressWindow(
        "ZoteroTag Updated",
        `${Zotero.ZoteroTag.versionInfo}`
      );
      Zotero.ZoteroTag.versionOpt();
    }
  },
};
