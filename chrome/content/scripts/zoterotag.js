Zotero.ZoteroTag = {
  version: 012,
  versionInfo: "New Feature: Remove after read. Please check Preference.",
  versionOpt: function () {
    let _rules = Zotero.ZoteroTag.rules();
    for (let i = 0; i < _rules.length; i++) {
      _rules[i].autoremove = _rules[i].autoadd;
    }
    Zotero.ZoteroTag.resetRules(_rules);
  },
  defaultRules: [
    {
      id: 1,
      tags: ["/unread"],
      autoadd: true,
      autoremove: true,
      color: "red",
      group: 1,
    },
  ],
  rules: function () {
    // Set default if not set.
    if (Zotero.Prefs.get("zoterotag.rules") === undefined) {
      Zotero.Prefs.set(
        "zoterotag.rules",
        JSON.stringify(Zotero.ZoteroTag.defaultRules)
      );
    }
    return JSON.parse(Zotero.Prefs.get("zoterotag.rules"));
  },
  resetRules: function (newRules = undefined) {
    if (typeof newRules === "undefined") {
      newRules = Zotero.ZoteroTag.defaultRules;
    }
    Zotero.Prefs.set("zoterotag.rules", JSON.stringify(newRules));
    return JSON.parse(Zotero.Prefs.get("zoterotag.rules"));
  },
  addRule: function (rule) {
    let rules = Zotero.ZoteroTag.rules();
    rule.id = rules.length + 1;
    rules.push(rule);
    Zotero.Prefs.set("zoterotag.rules", JSON.stringify(rules));
    return JSON.parse(Zotero.Prefs.get("zoterotag.rules"));
  },
  replaceRule: function (rule, id) {
    let rules = Zotero.ZoteroTag.rules();
    if (id > rules.length || id <= 0) {
      Zotero.debug("Zotero Tag Error: replaceRule out of range.");
    } else {
      rules[id - 1] = rule;
      Zotero.Prefs.set("zoterotag.rules", JSON.stringify(rules));
    }
    return JSON.parse(Zotero.Prefs.get("zoterotag.rules"));
  },
  removeRule: function (id) {
    let rules = Zotero.ZoteroTag.rules();
    if (id > rules.length || id <= 0) {
      Zotero.debug("Zotero Tag Error: removeRule out of range.");
    } else {
      rules.splice(id - 1, 1);
      for (let i = id - 1; i < rules.length; i++) {
        rules[i].id = i + 1;
      }
      Zotero.Prefs.set("zoterotag.rules", JSON.stringify(rules));
    }
    return JSON.parse(Zotero.Prefs.get("zoterotag.rules"));
  },
  getTagByGroup: function (group) {
    if (group === 0) {
      return Zotero.ZoteroTag.getTagByAuto();
    }
    let rules = Zotero.ZoteroTag.rules();
    let tags = [];
    for (let i = 0; i < rules.length; i++) {
      if (group === -1 || Number(rules[i].group) === group) {
        tags = tags.concat(rules[i].tags);
      }
    }
    return tags;
  },
  getTagByAuto: function (auto = true) {
    let rules = Zotero.ZoteroTag.rules();
    let tags = [];
    for (let i = 0; i < rules.length; i++) {
      if (rules[i].autoadd === auto) {
        tags = tags.concat(rules[i].tags);
      }
    }
    return tags;
  },
  getTagByRead: function (read = true) {
    let rules = Zotero.ZoteroTag.rules();
    let tags = [];
    for (let i = 0; i < rules.length; i++) {
      if (typeof rules[i].autoremove === "undefined") {
        rules[i].autoremove = rules[i].autoadd;
      }
      if (rules[i].autoremove === read) {
        tags = tags.concat(rules[i].tags);
      }
    }
    return tags;
  },
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
  checkVersion: function () {
    let version = Zotero.Prefs.get("zoterotag.version");
    Zotero.ZoteroTag.versionOpt();
    if (typeof version === "undefined" || version < Zotero.ZoteroTag.version) {
      Zotero.Prefs.set("zoterotag.version", Zotero.ZoteroTag.version);
      Zotero.ZoteroTag.showProgressWindow(
        "ZoteroTag Updated",
        `${Zotero.ZoteroTag.versionInfo}`
      );
    }
  },
  updateSelectedEntity: function (operation = "add", group = 1) {
    Zotero.debug("ZoteroTag: Updating items in entity");
    if (!ZoteroPane.canEdit()) {
      ZoteroPane.displayCannotEditLibraryMessage();
      return;
    }

    var collection = ZoteroPane.getSelectedCollection(false);

    if (collection) {
      Zotero.debug(
        "ZoteroTag: Updating items in entity: Is a collection == true"
      );
      var items = [];
      collection.getChildItems(false, false).forEach(function (item) {
        items.push(item);
      });
      suppress_warnings = true;
      Zotero.ZoteroTag.updateItems(
        items,
        operation,
        Zotero.ZoteroTag.getTagByGroup(group)
      );
    }
  },
  updateSelectedItems: function (operation = "add", group = 1) {
    Zotero.debug("ZoteroTag: Updating Selected items");

    Zotero.ZoteroTag.updateItems(
      ZoteroPane.getSelectedItems(),
      operation,
      Zotero.ZoteroTag.getTagByGroup(group)
    );
  },
  updateAll: function () {
    Zotero.debug("ZoteroTag: Updating all items in Zotero");
    var items = [];

    // Get all items
    Zotero.Items.getAll().then(function (items) {
      // Once we have all items, make sure it's a regular item.
      // And that the library is editable
      // Then add that item to our list.
      items.map(function (item) {
        if (item.isRegularItem() && !item.isCollection()) {
          var libraryId = item.getField("libraryID");
          if (
            libraryId == null ||
            libraryId == "" ||
            Zotero.Libraries.isEditable(libraryId)
          ) {
            items.push(item);
          }
        }
      });
    });

    // Update all of our items with pdfs.
    suppress_warnings = true;
    Zotero.ZoteroTag.updateItems(
      items,
      "add",
      Zotero.ZoteroTag.getTagByGroup(1)
    );
  },
  updateItems: function (items, operation, tags) {
    // If we don't have any items to update, just return.
    Zotero.debug("ZoteroTag: Updating items: " + JSON.stringify(items));
    if (items.length === 0) {
      return;
    }
    // Object.keys(items).forEach(function(key){
    // 	Zotero.debug(items[key])
    // });
    Zotero.ZoteroTag._updateCount = 0;
    items.forEach(function (val, idx) {
      Zotero.debug(val);
      Zotero.ZoteroTag.updateItem(val, operation, tags);
    });
    if (Zotero.ZoteroTag._updateCount == 0) {
      return;
    }
    if (operation == "change" && items.length == 1 && tags.length == 1) {
      operation = items[0].hasTag(tags[0]) ? "remove" : "add";
    }
    Zotero.ZoteroTag.showProgressWindow(
      "SUCCESS",
      `${operation} ${
        tags.length > 3 || tags.length === 0
          ? String(tags.length) + " tags"
          : tags
      } ${operation === "add" ? "to" : "from"} ${items.length} ${
        items.length > 1 ? "items" : "item"
      }.`
    );
  },
  updateItem: function (item, operation, tags) {
    Zotero.debug("ZoteroTag: Updating item: " + JSON.stringify(item));
    Zotero.debug(operation, tags);
    for (let i = 0; i < tags.length; ++i) {
      if (operation === "add" && !item.hasTag(tags[i])) {
        item.addTag(tags[i], 1);
        Zotero.ZoteroTag._updateCount += 1;
      } else if (operation === "remove" && item.hasTag(tags[i])) {
        item.removeTag(tags[i]);
        Zotero.ZoteroTag._updateCount += 1;
      } else if (operation === "change") {
        if (item.hasTag(tags[i])) {
          item.removeTag(tags[i]);
        } else {
          item.addTag(tags[i], 1);
        }
        Zotero.ZoteroTag._updateCount += 1;
      }
      item.saveTx();
    }
  },
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

window.addEventListener("add", Zotero.ZoteroTag.init(), false);

window.addEventListener(
  "load",
  function (e) {
    Zotero.ZoteroTag.init();
  },
  false
);
