export { getCurrentItems };

function getCurrentItems() {
  let items = [] as Zotero.Item[];
  switch (Zotero_Tabs.selectedType) {
    case "library": {
      items = Zotero.getActiveZoteroPane().getSelectedItems();
      break;
    }
    case "reader": {
      const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
      if (reader) {
        items = [reader._item];
      }
      break;
    }
  }
  return items;
}
