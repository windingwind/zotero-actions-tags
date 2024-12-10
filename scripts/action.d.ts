declare const window: Window;
declare const item: Zotero.Item | null;
declare const items: Zotero.Item[];
declare const collection: Zotero.Collection | false;
declare const triggerType:
  | "none"
  | "createItem"
  | "openFile"
  | "closeTab"
  | "createAnnotation"
  | "createNote"
  | "appendAnnotation"
  | "appendNote"
  | "programStartup"
  | "mainWindowLoad"
  | "mainWindowUnload"
  | "shortcut"
  | "menu"
  | "unknown";
declare function require(module: "Zotero"): _ZoteroTypes.Zotero;
declare function require(module: "ZoteroPane"): _ZoteroTypes.ZoteroPane;
declare function require(
  module: "Zotero_Tabs",
): _ZoteroTypes.MainWindow["Zotero_Tabs"];
declare function require(module: "window"): _ZoteroTypes.MainWindow;
declare function require(module: "document"): Document;
declare function require<
  K extends keyof typeof globalThis,
  GLOBAL extends typeof globalThis,
>(module: K): GLOBAL[K];
declare function require(module: string): any;
