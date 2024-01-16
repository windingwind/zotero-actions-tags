import { getCurrentItems } from "../utils/items";

export { initShortcuts };

function initShortcuts() {
  ztoolkit.Keyboard.register(async (ev, options) => {
    ztoolkit.log(options.keyboard?.getLocalized());
    if (!options.keyboard) return;

    const items = await getCurrentItems();
    // Trigger action for multiple items
    await addon.api.actionManager.dispatchActionByShortcut(options.keyboard, {
      itemIDs: items.map((item) => item?.id),
    });
    // Trigger action for each item
    for (const item of items) {
      await addon.api.actionManager.dispatchActionByShortcut(options.keyboard, {
        itemID: item.id,
      });
    }
  });
}
