Zotero.ZoteroTag = {
	tag_name: function() {
		// Set default if not set.
		if(Zotero.Prefs.get('zoterotag.tag_name') === undefined) {
			Zotero.Prefs.set('zoterotag.tag_name', '\\unread')
		}
		var tag_names = Zotero.Prefs.get('zoterotag.tag_name')
		return tag_names.split(',')
	},
	automatic_add_tag: function() {
		// Set default if not set.
		if(Zotero.Prefs.get('zoterotag.automatic_add_tag') === undefined) {
			Zotero.Prefs.set('zoterotag.automatic_add_tag', true)
		}
		return Zotero.Prefs.get('zoterotag.automatic_add_tag')
	},
	init: function() {
		Zotero.ZoteroTag.resetState();
		Zotero.ZoteroTag.tag_name();
		Zotero.ZoteroTag.automatic_add_tag();

		// Register the callback in Zotero as an item observer
		var notifierID = Zotero.Notifier.registerObserver(
						Zotero.ZoteroTag.notifierCallback, ['item']);

		// Unregister callback when the window closes (important to avoid a memory leak)
		window.addEventListener('unload', function(e) {
				Zotero.Notifier.unregisterObserver(notifierID);
		}, false);
	},
	notifierCallback: {
		// Adds pdfs when new item is added to zotero.
		notify: function(event, type, ids, extraData) {
			automatic_add_tag_bool = Zotero.Prefs.get('zoterotag.automatic_add_tag');
			Zotero.debug('ZoteroTag: add items when event == add: ' + automatic_add_tag_bool);
			if(event == "add" && type=='item' && !(automatic_add_tag_bool === undefined) && automatic_add_tag_bool == true) {
				Zotero.debug('ZoteroTag: first try')
				suppress_warnings = true;
				Zotero.ZoteroTag.updateItems(Zotero.Items.get(ids), suppress_warnings);
			}

			// Second attempts to force adding the new tag
      		// which is automatically removed ...
			// if (event == 'remove' && type == 'item-tag' && !(automatic_add_tag_bool === undefined) && automatic_add_tag_bool == true) {
			// 	Zotero.debug('ZoteroTag: second try')
			// 	let tags = Zotero.ZoteroTag.tag_name();
			// 	for (let i = 0; i < tags.length; ++i) {
			// 		const id_sc = Zotero.Tags.getID(tags[i]);
			// 		for (let i = 0; i < ids.length; ++i) {
			// 			const [id_item, id_tag] = ids[i].split('-');
			// 			if (id_tag == id_sc) {
			// 				const item = Zotero.Items.get(id_item);
			// 				item.addTag(tags[i]);
			// 				item.saveTx();
			// 			}
			// 		}
			// 	}
			// }
		}
	},
	resetState: function() {
		// Reset state for updating items.
		Zotero.ZoteroTag.current = -1;
		Zotero.ZoteroTag.toUpdate = 0;
		Zotero.ZoteroTag.itemsToUpdate = null;
		Zotero.ZoteroTag.numberOfUpdatedItems = 0;
	},
	updateSelectedEntity: function(libraryId) {
		Zotero.debug('Updating items in entity')
		if (!ZoteroPane.canEdit()) {
			ZoteroPane.displayCannotEditLibraryMessage();
			return;
		}

		var collection = ZoteroPane.getSelectedCollection(false);

		if (collection) {
			Zotero.debug("Updating items in entity: Is a collection == true")
			var items = [];
			collection.getChildItems(false, false).forEach(function (item) {
				items.push(item);
			});
			suppress_warnings = true;
			Zotero.ZoteroTag.updateItems(items, suppress_warnings);
		}
	},
	updateSelectedItems: function() {
		Zotero.debug('Updating Selected items');
		suppress_warnings = false;
		Zotero.ZoteroTag.updateItems(ZoteroPane.getSelectedItems(), suppress_warnings);
	},
	updateAll: function() {
		Zotero.debug('Updating all items in Zotero')
		var items = [];

		// Get all items
		Zotero.Items.getAll()
			.then(function (items) {
				// Once we have all items, make sure it's a regular item.
				// And that the library is editable
				// Then add that item to our list.
				items.map(function(item) {
					if (item.isRegularItem() && !item.isCollection()) {
						var libraryId = item.getField('libraryID');
						if (libraryId == null ||
								libraryId == '' ||
								Zotero.Libraries.isEditable(libraryId)) {
									items.push(item);
						}
					}
				});
			});

		// Update all of our items with pdfs.
		suppress_warnings = true;
		Zotero.ZoteroTag.updateItems(items, suppress_warnings);
	},
	updateItems: function(items, suppress_warnings) {
		// If we don't have any items to update, just return.
		Zotero.debug('Updating items: ' + JSON.stringify(items))
		// Object.keys(items).forEach(function(key){
		// 	Zotero.debug(items[key])
		// });

		items.forEach(function (val, idx) {
			Zotero.debug(val)
			Zotero.ZoteroTag.updateItem(val, suppress_warnings)
		})
	},
	updateItem: function(item, suppress_warnings) {
		Zotero.debug('Updating item: ' + JSON.stringify(item))
		Zotero.debug("Suppress: " + suppress_warnings)
		let tags = Zotero.ZoteroTag.tag_name();
		for (let i = 0; i < tags.length; ++i) {
			item.addTag(tags[i], 1);
			item.saveTx();
		}
	}
};

window.addEventListener('add', Zotero.ZoteroTag.init(), false);

window.addEventListener('load', function(e) {
  Zotero.ZoteroTag.init();
}, false);
