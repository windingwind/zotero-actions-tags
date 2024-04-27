import { ActionShowInMenu } from "./actions";

export { getCurrentItems, getItemsByKey };

async function getCurrentItems(
  type?: ActionShowInMenu,
  extraData?: {
    readerID?: string;
  },
) {
  let items = [] as Zotero.Item[];
  if (!type || type === "tools") {
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
      let reader: _ZoteroTypes.ReaderInstance;
      if (extraData?.readerID) {
        const _reader = Zotero.Reader._readers.find(
          (r) => r._instanceID === extraData.readerID,
        );
        if (!_reader) {
          throw new Error(
            `Reader ${extraData.readerID} not found in getCurrentItems()`,
          );
        }
        reader = _reader;
      } else {
        reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
      }
      const annotationIDs =
        // @ts-ignore TODO: update types
        reader?._internalReader._lastView._selectedAnnotationIDs as string[];
      if (annotationIDs?.length) {
        for (const key of annotationIDs) {
          const item = Zotero.Items.getByLibraryAndKey(
            reader._item.libraryID,
            key,
          );
          if (!item) continue;
          items.push(item as Zotero.Item);
        }
      } else {
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
