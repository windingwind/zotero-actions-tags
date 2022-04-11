export default {
  updateItem: function (item, operation, tags) {
    Zotero.debug("ZoteroTag: Updating item: " + JSON.stringify(item));
    Zotero.debug(operation, tags);
    for (let i = 0; i < tags.length; ++i) {
      if (operation === "add" && !item.hasTag(tags[i])) {
        item.addTag(tags[i], 1);
        Zotero.ZoteroTag._updateCount += 1;
      } else if (operation === "remove" && item.hasTag(tags[i])) {
        item.removeTag(tags[i]);
        Zotero.ZoteroTag._updateCount += 1;
      } else if (operation === "change") {
        if (item.hasTag(tags[i])) {
          item.removeTag(tags[i]);
        } else {
          item.addTag(tags[i], 1);
        }
        Zotero.ZoteroTag._updateCount += 1;
      }
      item.saveTx();
    }
  },
  updateItems: function (items, operation, tags) {
    // If we don't have any items to update, just return.
    Zotero.debug("ZoteroTag: Updating items: " + JSON.stringify(items));
    if (items.length === 0) {
      return;
    }
    // Object.keys(items).forEach(function(key){
    // 	Zotero.debug(items[key])
    // });
    Zotero.ZoteroTag._updateCount = 0;
    items.forEach(function (val, idx) {
      Zotero.debug(val);
      Zotero.ZoteroTag.updateItem(val, operation, tags);
    });
    if (Zotero.ZoteroTag._updateCount == 0) {
      return;
    }
    // Add/Remove is finished
    if (operation == "change" && items.length == 1 && tags.length == 1) {
      operation = items[0].hasTag(tags[0]) ? "add" : "remove";
    }
    Zotero.ZoteroTag.showProgressWindow(
      "SUCCESS",
      `${operation} ${
        tags.length > 3 || tags.length === 0
          ? String(tags.length) + " tags"
          : tags
      } ${operation === "add" ? "to" : "from"} ${items.length} ${
        items.length > 1 ? "items" : "item"
      }.`
    );
  },

  updateSelectedEntity: function (operation = "add", group = undefined) {
    Zotero.debug("ZoteroTag: Updating items in entity");
    if (!ZoteroPane.canEdit()) {
      ZoteroPane.displayCannotEditLibraryMessage();
      return;
    }

    var collection = ZoteroPane.getSelectedCollection(false);

    if (collection) {
      Zotero.debug(
        "ZoteroTag: Updating items in entity: Is a collection == true"
      );
      var items = [];
      collection.getChildItems(false, false).forEach(function (item) {
        items.push(item);
      });
      suppress_warnings = true;
      Zotero.ZoteroTag.updateItems(
        items,
        operation,
        Zotero.ZoteroTag.getTagByGroup(group)
      );
    }
  },
  updateSelectedItems: function (operation = "add", group = undefined) {
    Zotero.debug("ZoteroTag: Updating Selected items");

    Zotero.ZoteroTag.updateItems(
      ZoteroPane.getSelectedItems(),
      operation,
      Zotero.ZoteroTag.getTagByGroup(group)
    );
  },
  updateAll: function () {
    Zotero.debug("ZoteroTag: Updating all items in Zotero");
    var items = [];

    // Get all items
    Zotero.Items.getAll().then(function (items) {
      // Once we have all items, make sure it's a regular item.
      // And that the library is editable
      // Then add that item to our list.
      items.map(function (item) {
        if (item.isRegularItem() && !item.isCollection()) {
          var libraryId = item.getField("libraryID");
          if (
            libraryId == null ||
            libraryId == "" ||
            Zotero.Libraries.isEditable(libraryId)
          ) {
            items.push(item);
          }
        }
      });
    });

    // Update all of our items with pdfs.
    suppress_warnings = true;
    Zotero.ZoteroTag.updateItems(
      items,
      "add",
      Zotero.ZoteroTag.getTagByGroup(1)
    );
  },
};
