initZTagPreferences = function () {
  let rules = Zotero.ZoteroTag.rules();
  Zotero.debug("ZoteroTag: Initialize preferences.");
  Zotero.debug(rules);
  refreshPreferencesView(rules);
};

resetZTagPreferences = function () {
  Zotero.debug("ZoteroTag: Reset preferences.");
  let rules = Zotero.ZoteroTag.resetRules();
  Zotero.debug(rules);
  refreshPreferencesView(rules);
  Zotero.ZoteroTag.showProgressWindow("Zotero Tag", "Rules reset to default.");
};

ZTagAddRule = function () {
  Zotero.debug("ZoteroTag: Add rule.");
  let rule = {
    id: "",
    tags: [""],
    untags: [],
    actions: [],
    group: 1,
  };
  let rules = Zotero.ZoteroTag.addRule(rule);
  refreshPreferencesView(rules);
  Zotero.ZoteroTag.showProgressWindow("Zotero Tag", "New rule created.");
};

refreshRule = function (id) {
  Zotero.debug(`ZoteroTag: Refresh rule ${id}`);
  let rule = {};
  rule.id = Number(id);
  const tags = document
    .getElementById(`zoterotag-rules-${id}-tags`)
    .value.split(",");
  rule.tags = tags.filter((tag) => tag.slice(0, 2) !== "~~");
  rule.untags = tags
    .filter((tag) => tag.slice(0, 2) === "~~")
    .map((tag) => tag.slice(2));
  rule.group = document.getElementById(`zoterotag-rules-${id}-group`).value;
  let selected = document.getElementById(
    `zoterotag-rules-${id}-actions`
  ).selectedIndex;
  if (Zotero.ZoteroTag.availableActions[selected]) {
    rule.actions = [Zotero.ZoteroTag.availableActions[selected]];
  } else {
    rule.actions = [];
  }
  Zotero.debug(rule);
  let rules = Zotero.ZoteroTag.replaceRule(rule, id);
  refreshPreferencesView(rules);
  Zotero.ZoteroTag.showProgressWindow("Zotero Tag", "Rules saved.");
};

ZTagRemoveRule = function () {
  Zotero.debug("ZoteroTag: Refresh rule.");
  let rules = Zotero.ZoteroTag.removeRule(getSelectedTemplateName());
  refreshPreferencesView(rules);
  Zotero.ZoteroTag.showProgressWindow("Zotero Tag", "Rule removed.");
};

getSelectedTemplateName = function () {
  const listbox = document.getElementById("zoterotag-rules-listbox");
  const selectedItem = listbox.selectedItem;
  if (selectedItem) {
    const name = selectedItem.getAttribute("id").split("-").pop();
    return name;
  }
  return "";
};

refreshPreferencesView = function (rules) {
  let listbox = document.getElementById("zoterotag-rules-listbox");
  let e,
    es = document.getElementsByTagName("listitem");
  while (es.length > 0) {
    e = es[0];
    e.parentElement.removeChild(e);
  }
  listbox.removeChild;
  for (let key in rules) {
    listbox.appendChild(creatRuleListElement(rules[key]));
  }
  document
    .querySelector("#zotero-prefpane-zoterotag-removerule")
    .setAttribute("disabled", true);
};

creatRuleListElement = function (rule) {
  let listIDHead = "zoterotag-rules";
  let listitem,
    listcell,
    label,
    textbox,
    menulist,
    menupopup,
    menuitem,
    checkbox,
    button;

  listitem = document.createElement("listitem");
  listitem.setAttribute("id", `${listIDHead}-${rule.id}`);
  listitem.setAttribute("allowevents", "true");
  listitem.addEventListener("click", (e) => {
    if (listitem.selected) {
      document
        .querySelector("#zotero-prefpane-zoterotag-removerule")
        .removeAttribute("disabled");
    }
  });

  listcell = document.createElement("listcell");
  label = document.createElement("label");
  label.setAttribute("id", `${listIDHead}-${rule.id}-id`);
  label.setAttribute("value", rule.id);
  listcell.appendChild(label);
  listitem.appendChild(listcell);

  const tags = rule.tags.concat(
    rule.untags ? rule.untags.map((tag) => `~~${tag}`) : []
  );
  listcell = document.createElement("listcell");
  textbox = document.createElement("textbox");
  textbox.setAttribute("id", `${listIDHead}-${rule.id}-tags`);
  textbox.setAttribute("value", `${tags}`);
  textbox.setAttribute("style", "width: 190px");
  textbox.addEventListener("change", (e) => {
    refreshRule(rule.id);
  });
  listcell.appendChild(textbox);
  listitem.appendChild(listcell);

  listcell = document.createElement("listcell");
  menulist = document.createElement("menulist");
  menulist.setAttribute("id", `${listIDHead}-${rule.id}-group`);
  menupopup = document.createElement("menupopup");
  for (const i of Object.keys(Zotero.ZoteroTag.availableShortcuts)) {
    menuitem = document.createElement("menuitem");
    menuitem.setAttribute("value", i);
    menuitem.setAttribute("label", Zotero.ZoteroTag.availableShortcuts[i]);
    menupopup.appendChild(menuitem);
  }
  menulist.setAttribute("value", `${rule.group}`);
  menulist.appendChild(menupopup);
  menulist.addEventListener("command", (e) => {
    refreshRule(rule.id);
  });
  listcell.appendChild(menulist);
  listitem.appendChild(listcell);

  listcell = document.createElement("listcell");
  menulist = document.createElement("menulist");
  menulist.setAttribute("id", `${listIDHead}-${rule.id}-actions`);
  menupopup = document.createElement("menupopup");
  menuValueList = [];
  menuLabelList = [];
  let selected = undefined;
  for (let i = 0; i < Zotero.ZoteroTag.availableActions.length; i++) {
    let op = Zotero.ZoteroTag.availableActions[i].operation;
    let ev = Zotero.ZoteroTag.availableActions[i].event;
    const description = Zotero.ZoteroTag.availableActions[i].description;
    menuValueList.push(i);
    menuLabelList.push(description);
    if (
      rule.actions &&
      rule.actions.length &&
      rule.actions[0].operation == op &&
      rule.actions[0].event == ev
    ) {
      selected = i;
    }
  }
  menuValueList.push(Zotero.ZoteroTag.availableActions.length);
  menuLabelList.push("disabled");
  // Select the last element
  if (typeof selected == "undefined") {
    selected = menuValueList.length - 1;
  }
  for (let i = 0; i < menuValueList.length; i++) {
    menuitem = document.createElement("menuitem");
    menuitem.setAttribute("value", menuValueList[i]);
    menuitem.setAttribute("label", menuLabelList[i]);
    menupopup.appendChild(menuitem);
  }
  // menulist.setAttribute("value", `${rule.group}`);
  menulist.appendChild(menupopup);
  menulist.setAttribute("value", selected);
  menulist.addEventListener("command", (e) => {
    refreshRule(rule.id);
  });
  listcell.appendChild(menulist);
  listitem.appendChild(listcell);
  return listitem;
};
