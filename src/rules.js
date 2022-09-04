export default {
  defaultRules: [
    {
      id: 1,
      tags: ["/unread"],
      untags: [],
      actions: [
        {
          event: "add",
          operation: "add",
        },
      ],
      group: 1,
    },
    {
      id: 2,
      tags: ["/unread"],
      untags: [],
      actions: [
        {
          event: "open",
          operation: "remove",
        },
      ],
      group: 1,
    },
  ],
  availableActions: [
    {
      event: "add",
      operation: "add",
    },
    {
      event: "open",
      operation: "add",
    },
    {
      event: "open",
      operation: "remove",
    },
    {
      event: "close",
      operation: "add",
    },
    {
      event: "close",
      operation: "remove",
    },
    {
      event: "annotation add",
      operation: "add",
    },
  ],
  availableShortcuts: {
    1: "alt+1",
    2: "alt+2",
    3: "alt+3",
    4: "alt+4",
    5: "alt+5",
    6: "alt+6",
    7: "alt+7",
    8: "alt+8",
    9: "alt+9",
    11: "ctrl+alt+1",
    12: "ctrl+alt+2",
    13: "ctrl+alt+3",
    14: "ctrl+alt+4",
    15: "ctrl+alt+5",
    16: "ctrl+alt+6",
    17: "ctrl+alt+7",
    18: "ctrl+alt+8",
    19: "ctrl+alt+9",
    // 21: "alt+shift+1",
    // 22: "alt+shift+2",
    // 23: "alt+shift+3",
    // 24: "alt+shift+4",
    // 25: "alt+shift+5",
    // 26: "alt+shift+6",
    // 27: "alt+shift+7",
    // 28: "alt+shift+8",
    // 29: "alt+shift+9",
  },
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
};
