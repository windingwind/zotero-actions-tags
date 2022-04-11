import events from "./events";
import rules from "./rules";
import tags from "./tags";
import updateItems from "./updateItems";
import view from "./view";

ZoteroTag = {};

Object.assign(ZoteroTag, events, rules, tags, updateItems, view);

Zotero.ZoteroTag = ZoteroTag;

window.addEventListener("add", Zotero.ZoteroTag.init(), false);

window.addEventListener(
  "load",
  function (e) {
    Zotero.ZoteroTag.init();
  },
  false
);
