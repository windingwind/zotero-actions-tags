export { recordTabStatus };

function recordTabStatus() {
  addon.data.tabStatus.clear();
  for (const tab of Zotero_Tabs._tabs) {
    if (tab.type === "reader") {
      addon.data.tabStatus.set(tab.id, tab.data.itemID);
    }
  }
}
