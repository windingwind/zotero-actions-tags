import { getCurrentItems } from "../utils/items";
import { KeyModifier } from "../utils/shorcut";
import { waitUntil } from "../utils/wait";

export { initWindowShortcuts, unInitWindowShortcuts, initReaderShortcuts };

function initWindowShortcuts(win: Window) {
  _initShortcuts(win);
}

function unInitWindowShortcuts(win: Window) {
  _unInitShortcuts(win);
}

function initReaderShortcuts() {
  Zotero.Reader.registerEventListener("renderToolbar", (event) => {
    const reader = event.reader;
    _initShortcuts(reader._iframeWindow);
    waitUntil(
      () => (reader._internalReader?._primaryView as any)?._iframeWindow,
      () =>
        _initShortcuts(
          (reader._internalReader._primaryView as any)?._iframeWindow,
        ),
    );
  });
}

function _initShortcuts(win?: Window) {
  if (!win) {
    return;
  }
  win.addEventListener("keydown", savePressedKeys);
  win.addEventListener("keyup", triggerShortcut);
}

function _unInitShortcuts(win?: Window) {
  if (!win) {
    return;
  }
  win.removeEventListener("keydown", savePressedKeys);
  win.removeEventListener("keyup", triggerShortcut);
}

function savePressedKeys(e: KeyboardEvent) {
  if (!addon.data.shortcut) {
    addon.data.shortcut = new KeyModifier("");
  }
  const shortcut = addon.data.shortcut;
  shortcut.control = e.ctrlKey;
  shortcut.meta = e.metaKey;
  shortcut.shift = e.shiftKey;
  shortcut.alt = e.altKey;
  if (!["Shift", "Meta", "Ctrl", "Alt", "Control"].includes(e.key)) {
    shortcut.key = e.key;
  }
}

async function triggerShortcut(e: KeyboardEvent) {
  if (!addon.data.shortcut) {
    return;
  }
  const shortcut = new KeyModifier(addon.data.shortcut.getRaw());
  addon.data.shortcut = undefined;

  const items = getCurrentItems();
  // Trigger action for multiple items
  await addon.api.actionManager.dispatchActionByShortcut(shortcut, {
    itemIDs: items.map((item) => item?.id),
  });
  // Trigger action for each item
  for (const item of items) {
    await addon.api.actionManager.dispatchActionByShortcut(shortcut, {
      itemID: item.id,
    });
  }
}
