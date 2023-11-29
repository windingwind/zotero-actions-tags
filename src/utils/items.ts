import { ActionShowInMenu } from "./actions";

export { getCurrentItems, getItemsByKey };

async function getCurrentItems(type?: ActionShowInMenu) {
  let items = [] as Zotero.DataObject[];
  if (!type) {
    type = getCurrentTargetType();
  }
  switch (type) {
    case "item": {
      items = Zotero.getActiveZoteroPane().getSelectedItems();
      break;
    }
    case "collection": {
      const collection = Zotero.getActiveZoteroPane().getSelectedCollection();
      if (collection) {
        items = collection?.getChildItems() as Zotero.Item[];
      } else {
        const libraryID = Zotero.getActiveZoteroPane().getSelectedLibraryID();
        if (libraryID) {
          items = await Zotero.Items.getAll(libraryID);
        }
      }
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

function getItemsByKey(libraryID: number, ...keys: string[]) {
  const items = [] as Zotero.DataObject[];
  for (const key of keys) {
    const item = Zotero.Items.getByLibraryAndKey(libraryID, key);
    if (item) {
      items.push(item);
    }
  }
  return items;
}

function getCurrentTargetType() {
  switch (Zotero_Tabs.selectedType) {
    case "library": {
      return "item";
    }
    case "reader": {
      return "reader";
    }
    default:
      return "item";
  }
}
