import { ActionShowInMenu } from "./actions";

export { getCurrentItems, getItemIDsByKey };

async function getCurrentItems(
  type?: ActionShowInMenu,
  extraData?: {
    readerID?: string;
  },
): Promise<Zotero.Item[]>;

async function getCurrentItems(
  type?: ActionShowInMenu,
  extraData?: {
    readerID?: string;
    asIDs: true;
  },
): Promise<number[]>;

async function getCurrentItems(
  type?: ActionShowInMenu,
  extraData?: {
    readerID?: string;
    asIDs?: boolean;
  },
): Promise<Zotero.Item[] | number[]> {
  const asIDs = !!extraData?.asIDs;
  let items = [] as Zotero.Item[] | number[];
  if (!type || type === "tools") {
    type = getCurrentTargetType();
  }
  switch (type) {
    case "item": {
      // Stupid but for type inference
      items = asIDs
        ? Zotero.getActiveZoteroPane().getSelectedItems(true)
        : Zotero.getActiveZoteroPane().getSelectedItems(false);
      break;
    }
    case "collection": {
      const collection = Zotero.getActiveZoteroPane().getSelectedCollection();
      if (collection) {
        items = asIDs
          ? collection?.getChildItems(true)
          : collection?.getChildItems(false);
      } else {
        const libraryID = Zotero.getActiveZoteroPane().getSelectedLibraryID();
        if (libraryID) {
          items = await (asIDs
            ? Zotero.Items.getAll(libraryID, false, false, true)
            : Zotero.Items.getAll(libraryID, false, false, false));
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
          ) as Zotero.Item;
          if (!item) continue;
          items.push((asIDs ? item.id : item) as Zotero.Item & number);
        }
      } else {
        items = [asIDs ? reader._item.id : reader._item] as Zotero.Item[] &
          number[];
      }
      break;
    }
  }
  return items;
}

function getItemIDsByKey(libraryID: number, ...keys: string[]) {
  const itemIDs = [] as number[];
  for (const key of keys) {
    const item = Zotero.Items.getByLibraryAndKey(libraryID, key);
    if (item) {
      itemIDs.push(item.id);
    }
  }
  return itemIDs;
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
