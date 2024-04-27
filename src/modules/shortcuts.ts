import { getCurrentItems } from "../utils/items";

export { initShortcuts };

function initShortcuts() {
  ztoolkit.Keyboard.register(async (ev, options) => {
    ztoolkit.log(options.keyboard?.getLocalized());
    // Do nothing if the keyboard shortcut is not set or is "accel,A"
    // "accel,A" is the default keyboard shortcut for selecting all items
    // https://github.com/windingwind/zotero-actions-tags/issues/315
    if (
      !options.keyboard ||
      options.keyboard.equals("accel,A") ||
      ["input", "textarea", "select", "search-textbox", "textbox"].includes(
        (ev.target as HTMLElement)?.localName.toLowerCase(),
      )
    )
      return;
    ztoolkit.log("triggered", options.keyboard.getLocalized(), ev);

    const itemIDs = await getCurrentItems(undefined, { asIDs: true });
    // Trigger action for multiple items
    await addon.api.actionManager.dispatchActionByShortcut(options.keyboard, {
      itemIDs,
    });
    // Trigger action for each item
    for (const itemID of itemIDs) {
      await addon.api.actionManager.dispatchActionByShortcut(options.keyboard, {
        itemID,
      });
    }
  });
}
