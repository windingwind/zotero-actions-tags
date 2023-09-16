import { KeyModifier } from "../utils/shorcut";

export { initShortcuts, unInitShortcuts };

function initShortcuts(win: Window) {
  win.addEventListener("keydown", savePressedKeys);
  win.addEventListener("keyup", triggerShortcut);
}

function unInitShortcuts(win: Window) {
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

  if (Zotero_Tabs.selectedType !== "library") {
    return;
  }
  const items = Zotero.getActiveZoteroPane().getSelectedItems();
  if (items.length === 0) {
    await addon.api.actionManager.dispatchActionByShortcut(shortcut, {
      itemID: -1,
    });
    return;
  }
  for (const item of items) {
    await addon.api.actionManager.dispatchActionByShortcut(shortcut, {
      itemID: item.id,
    });
  }
}
