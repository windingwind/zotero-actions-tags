export default {
  itemEditable: function (item) {
    if (item.isFeedItem) {
      Zotero.debug("skip feed item");
      return false;
    }
    let collections = item.getCollections();
    for (let collection of collections) {
      let libraryID = Zotero.Collections.get(collection).libraryID;
      if (libraryID) {
        let library = Zotero.Libraries.get(libraryID);
        if (library && !library.editable) {
          return false;
        }
      }
    }
    return true;
  },
  getChildItemsRecursively: function (collection, recursive = true) {
    let _items = collection.getChildItems();
    const subCollections = collection.getChildCollections();
    if (recursive && subCollections.length) {
      subCollections.forEach((subCollection) => {
        _items = _items.concat(
          Zotero.ZoteroTag.getChildItemsRecursively(subCollection)
        );
      });
    }
    return _items;
  },
  updateItem: async function (item, operation, tags, userTag = false) {
    Zotero.debug("ZoteroTag: Updating item: " + JSON.stringify(item));
    Zotero.debug(operation, tags);
    let updateCount = 0;
    for (let i = 0; i < tags.length; ++i) {
      if (operation === "add" && !item.hasTag(tags[i])) {
        item.addTag(tags[i], userTag ? 0 : 1);
        updateCount += 1;
      } else if (operation === "remove" && item.hasTag(tags[i])) {
        item.removeTag(tags[i]);
        updateCount += 1;
      } else if (operation === "change") {
        if (item.hasTag(tags[i])) {
          item.removeTag(tags[i]);
        } else {
          item.addTag(tags[i], userTag ? 0 : 1);
        }
        updateCount += 1;
      } else if (operation === "custom") {
        tags[i](item, userTag);
        updateCount += 1;
      }
    }
    await item.saveTx();
    return updateCount;
  },
  updateItems: async function (
    items,
    operation,
    tags,
    userTag = false,
    addtionInfo = ""
  ) {
    items = items.filter((i) => Zotero.ZoteroTag.itemEditable(i));
    // If we don't have any items to update, just return.
    if (items.length === 0 || tags.length === 0) {
      return;
    }
    Zotero.debug("ZoteroTag: Updating items: " + JSON.stringify(items) + tags);
    // Add/Remove is finished
    let infoOperation =
      operation == "change" && items.length == 1 && tags.length == 1
        ? items[0].hasTag(tags[0])
          ? "remove"
          : "add"
        : operation;
    const infoBody = `${infoOperation} ${
      operation === "custom"
        ? "operation"
        : tags.length > 3 || tags.length === 0
        ? String(tags.length) + " tags"
        : tags
    }`;
    const progress = Zotero.ZoteroTag.showProgressWindow(
      "[Pending] Zotero Tag",
      `[0/${items.length}] ${infoBody} ${addtionInfo}`,
      "success",
      -1
    );
    progress.progress.setProgress(1);
    let t = 0;
    // Wait for ready
    while (!progress.progress._itemText && t < 100) {
      t += 1;
      await Zotero.Promise.delay(10);
    }
    let doneCount = 0;
    let skipCount = 0;
    for (const item of items) {
      const updatedCount = await Zotero.ZoteroTag.updateItem(
        item,
        operation,
        tags,
        userTag
      );
      updatedCount > 0 ? (doneCount += 1) : (skipCount += 1);
      console.log(progress.progress._itemText);
      Zotero.ZoteroTag.changeProgressWindowDescription(
        progress,
        `[${doneCount}/${items.length}]${
          skipCount > 0 ? `(${skipCount} skipped)` : ""
        } ${infoBody} ${addtionInfo}`
      );
      progress
        ? progress.progress.setProgress((doneCount / items.length) * 100)
        : null;
    }
    console.log(progress);
    if (progress) {
      progress.progress.setProgress(100);
      progress.changeHeadline("[Done] Zotero Tag");
      progress.startCloseTimer(5000);
    }
  },
  updateSelectedItems: async function (
    options = { operation: "add", group: undefined, targetType: "" }
  ) {
    Zotero.debug("ZoteroTag: Updating Selected items");
    console.log(options);
    if (Zotero_Tabs.selectedID == "zotero-pane") {
      let tags = [];
      let userTag = false;
      let includeSubCollections = false;
      const selectedCollection = ZoteroPane.getSelectedCollection(false);
      const selectedItems = ZoteroPane.getSelectedItems();
      if (typeof options.group === "undefined") {
        const io = {
          dataIn: {
            isCollection:
              options.targetType === "collection" && selectedCollection,
            targetType: options.targetType,
          },
          dataOut: {},
          deferred: Zotero.Promise.defer(),
        };

        window.openDialog(
          "chrome://zoterotag/content/manual.xul",
          "",
          "chrome,centerscreen,width=500,height=200,alwaysRaised=yes",
          io
        );
        await io.deferred.promise;
        options.operation = io.dataOut.operation;
        tags = io.dataOut.tags;
        userTag = io.dataOut.userTag;
        includeSubCollections = io.dataOut.includeSubCollections;
        if (tags.length === 0) {
          return;
        }
      } else {
        tags = Zotero.ZoteroTag.getTagByGroup(Number(options.group));
      }
      let items = [];
      if (options.targetType === "item") {
        items = selectedItems;
      } else {
        if (selectedCollection) {
          // Fallback to collection items
          items = Zotero.ZoteroTag.getChildItemsRecursively(
            selectedCollection,
            includeSubCollections
          );
        } else {
          // Fallback to library items
          items = await Zotero.Items.getAll(ZoteroPane.getSelectedLibraryID());
        }
      }
      Zotero.ZoteroTag.updateItems(
        items,
        options.operation,
        tags.filter((tag) => tag.slice(0, 2) !== "~~"),
        userTag
      );
      Zotero.ZoteroTag.updateItems(
        items,
        "remove",
        tags
          .filter((tag) => tag.slice(0, 2) === "~~")
          .map((tag) => tag.slice(2))
      );
    } else {
      Zotero.ZoteroTag.updateAnnotation(options.operation, Number(group));
    }
  },
  updateAction: function (items, action) {
    let tags = Zotero.ZoteroTag.getTagsByEvent(action.event);
    for (let operation in tags) {
      Zotero.ZoteroTag.updateItems(items, operation, tags[operation]);
    }
  },
  updateAnnotation: function (operation, group) {
    let currentReader = Zotero.ZoteroTag.getReader();
    if (!currentReader) {
      return;
    }
    // Get selected annotation
    let annot = currentReader._iframeWindow.document.querySelector(
      ".annotation.selected"
    );
    if (!annot) {
      Zotero.ZoteroTag.showProgressWindow(
        "FAIL",
        "No annotation selected.",
        "fail"
      );
      return;
    }
    let annotKey = annot.getAttribute("data-sidebar-annotation-id");
    const item = Zotero.Items.get(currentReader.annotationItemIDs).find(
      (_i) => _i.key === annotKey
    );
    let tags = Zotero.ZoteroTag.getTagByGroup(group);
    Zotero.ZoteroTag.updateItems(
      [item],
      operation,
      tags.filter((tag) => tag.slice(0, 2) !== "~~")
    );
    Zotero.ZoteroTag.updateItems(
      [item],
      "remove",
      tags.filter((tag) => tag.slice(0, 2) === "~~").map((tag) => tag.slice(2))
    );
    return true;
  },
};
