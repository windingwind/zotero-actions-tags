export default {
  version: 20,
  versionInfo:
    "New Feature: Support multiple actions. Please check Preference.",

  init: function () {
    Zotero.ZoteroTag.checkVersion();
    Zotero.ZoteroTag.rules();

    // Register the callback in Zotero as an item observer
    let notifierID = Zotero.Notifier.registerObserver(
      Zotero.ZoteroTag.notifierCallback,
      ["file", "item"]
    );

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener(
      "unload",
      function (e) {
        Zotero.Notifier.unregisterObserver(notifierID);
      },
      false
    );

    Zotero.ZoteroTag.initKeys();
  },
  notifierCallback: {
    notify: function (event, type, ids, extraData) {
      let items = [];
      let action = {};
      if (event == "open" && type == "file") {
        Zotero.debug("ZoteroTag: file open detected.");
        items = Zotero.Items.get(ids)
          .map((item, index, arr) => item.parentItem)
          .filter((item) => item.isRegularItem());
        action.event = "open";
      }
      if (event == "add" && type == "item") {
        Zotero.debug("ZoteroTag: item add detected.");
        items = Zotero.Items.get(ids).filter((item) => item.isRegularItem());
        action.event = "add";
      }
      Zotero.ZoteroTag.updateAction(items, action);
    },
  },
  initKeys: function () {
    let shortcuts = [];
    // init shortcuts
    for (let i = 1; i <= 9; i++) {
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

  versionOpt: function () {
    let rules = Zotero.ZoteroTag.rules();
    let newRules = [];
    let idOffset = 0;
    for (let i = 0; i < rules.length; i++) {
      if (typeof rules[i].actions == "undefined") {
        rules[i].actions = [];
        if (rules[i].autoadd && rules[i].autoremove) {
          let newRule = {};
          Object.assign(newRule, rules[i]);
          newRule.actions = [{ event: "add", operation: "add" }];
          idOffset++;
          newRules.push(newRule);
          rules[i].autoadd = false;
        } else if (rules[i].autoadd) {
          rules[i].actions.push({
            event: "add",
            operation: "add",
          });
        }
        if (rules[i].autoremove) {
          rules[i].actions.push({
            event: "open",
            operation: "remove",
          });
        }
      }
      delete rules[i].autoadd;
      delete rules[i].autoremove;
      rules[i].id += idOffset;
      newRules.push(rules[i]);
    }
    Zotero.ZoteroTag.resetRules(newRules);
  },
  checkVersion: function (force = false) {
    let _version = Zotero.Prefs.get("zoterotag.version");
    if (
      force ||
      typeof _version === "undefined" ||
      _version < Zotero.ZoteroTag.version
    ) {
      Zotero.ZoteroTag.versionOpt();
      Zotero.Prefs.set("zoterotag.version", Zotero.ZoteroTag.version);
      Zotero.ZoteroTag.showProgressWindow(
        "ZoteroTag Updated",
        `${Zotero.ZoteroTag.versionInfo}`
      );
    }
  },
};
