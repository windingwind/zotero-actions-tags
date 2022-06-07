export default {
  version: 20,
  versionInfo:
    "New Feature: Support multiple actions. Please check Preference.",
  _tabs: [],

  init: function () {
    Zotero.ZoteroTag.checkVersion();
    Zotero.ZoteroTag.rules();
    Zotero.ZoteroTag.recordTabs();

    // Register the callback in Zotero as an item observer
    let notifierID = Zotero.Notifier.registerObserver(
      Zotero.ZoteroTag.notifierCallback,
      ["file", "item", "tab"]
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
      if (event == "add" && type == "tab") {
        Zotero.ZoteroTag.recordTabs();
      }
      if (event == "close" && type == "tab") {
        Zotero.debug("ZoteroTag: file close detected.");
        Zotero.debug(Zotero.ZoteroTag._tabs);
        for (const tabID of ids) {
          const tabItem = Zotero.ZoteroTag._tabs.filter((e) => {
            return e.id === tabID;
          });
          if (tabItem.length > 0) {
            const item = Zotero.Items.get(tabItem[0].data.itemID);
            if (item && item.parentItem && item.parentItem.isRegularItem()) {
              items.push(item.parentItem);
            }
          }
        }
        action.event = "close";
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
    const ruleGroups = Zotero.ZoteroTag.rules().map((e) => e.group);
    for (let i = 1; i <= 9; i++) {
      if (ruleGroups.indexOf(String(i)) === -1) {
        continue;
      }
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
        Zotero.debug(`Zotero Tag: ${keyObj.group} pressed`);
        Zotero.ZoteroTag.updateSelectedItems(keyObj.operation, keyObj.group);
      } catch (error) {
        Zotero.ZoteroTag.showProgressWindow(
          "ERROR",
          "Zotero Tag: Fail to add/remove tags.",
          "fail"
        );
        Zotero.debug(error);
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

  recordTabs: function () {
    Zotero.debug("Zotero Tag: Tabs record updated.");
    Zotero.ZoteroTag._tabs = [];
    for (const tab of Zotero_Tabs._tabs) {
      if (tab.type === "reader") {
        Zotero.ZoteroTag._tabs.push({
          id: tab.id,
          data: tab.data,
        });
      }
    }
    Zotero.debug(Zotero.ZoteroTag._tabs);
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
