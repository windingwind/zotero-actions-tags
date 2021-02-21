Zotero.ZoteroTag = {
    default_rule: [
        {
            'id': 1,
            'tags': ['/unread'],
            'autoadd': true,
            'color': 'red',
            'group': 1,
        }
    ],
    rules: function() {
        // Set default if not set.
        if(Zotero.Prefs.get('zoterotag.rules') === undefined) {
            Zotero.Prefs.set('zoterotag.rules', JSON.stringify(Zotero.ZoteroTag.default_rule));
        }
        return JSON.parse(Zotero.Prefs.get('zoterotag.rules'));
    },
    resetRules: function() {
        Zotero.Prefs.set('zoterotag.rules', JSON.stringify(Zotero.ZoteroTag.default_rule));
        return JSON.parse(Zotero.Prefs.get('zoterotag.rules'));
    },
    addRule: function(rule) {
        let rules = Zotero.ZoteroTag.rules();
        rule.id = rules.length + 1;
        rules.push(rule);
        Zotero.Prefs.set('zoterotag.rules', JSON.stringify(rules));
        return JSON.parse(Zotero.Prefs.get('zoterotag.rules'));
    },
    replaceRule: function(rule, id) {
        let rules = Zotero.ZoteroTag.rules();
        if (id > rules.length || id <= 0 ){
            Zotero.debug('Zotero Tag Error: replaceRule out of range.');
        } else {
            rules[id-1] = rule;
            Zotero.Prefs.set('zoterotag.rules', JSON.stringify(rules));
        }
        return JSON.parse(Zotero.Prefs.get('zoterotag.rules'));
    },
    removeRule: function(id) {
        let rules = Zotero.ZoteroTag.rules();
        if (id > rules.length || id <= 0 ){
            Zotero.debug('Zotero Tag Error: removeRule out of range.');
        } else {
            rules.splice(id-1, 1);
            for(let i=id-1; i<rules.length; i++){
                rules[i].id = i+1;
            }
            Zotero.Prefs.set('zoterotag.rules', JSON.stringify(rules));
        }
        return JSON.parse(Zotero.Prefs.get('zoterotag.rules'));
    },
    getTagByGroup: function(group) {
        if(group === 0){
            return Zotero.ZoteroTag.getTagByAuto();
        }
        let rules = Zotero.ZoteroTag.rules();
        let tags = [];
        for(let i=0; i<rules.length; i++){
            if(group === -1 || Number(rules[i].group) === group) {
                tags = tags.concat(rules[i].tags);
            }
        }
        return tags;
    },
    getTagByAuto: function(auto=true) {
        let rules = Zotero.ZoteroTag.rules();
        let tags = [];
        for(let i=0; i<rules.length; i++){
            if(rules[i].autoadd === auto) {
                tags = tags.concat(rules[i].tags);
            }
        }
        return tags;
    },

    // tag_name: function() {
    //     // Set default if not set.
    //     if(Zotero.Prefs.get('zoterotag.tag_name') === undefined) {
    //         Zotero.Prefs.set('zoterotag.tag_name', '\\unread')
    //     }
    //     var tag_names = Zotero.Prefs.get('zoterotag.tag_name')
    //     return tag_names.split(',')
    // },
    // automatic_add_tag: function() {
    //     // Set default if not set.
    //     if(Zotero.Prefs.get('zoterotag.automatic_add_tag') === undefined) {
    //         Zotero.Prefs.set('zoterotag.automatic_add_tag', true)
    //     }
    //     return Zotero.Prefs.get('zoterotag.automatic_add_tag')
    // },
    init: function() {
        Zotero.ZoteroTag.resetState();
        // Zotero.ZoteroTag.tag_name();
        // Zotero.ZoteroTag.automatic_add_tag();
        Zotero.ZoteroTag.rules();

        // Register the callback in Zotero as an item observer
        var notifierID = Zotero.Notifier.registerObserver(
                        Zotero.ZoteroTag.notifierCallback, ['item']);

        // Unregister callback when the window closes (important to avoid a memory leak)
        window.addEventListener('unload', function(e) {
                Zotero.Notifier.unregisterObserver(notifierID);
        }, false);

        Zotero.ZoteroTag.initKeys();
    },
    notifierCallback: {
        // Adds pdfs when new item is added to zotero.
        notify: function(event, type, ids, extraData) {
            automatic_add_tag_bool = Zotero.Prefs.get('zoterotag.automatic_add_tag');
            Zotero.debug('ZoteroTag: add items when event == add: ' + automatic_add_tag_bool);
            if(event == "add" && type=='item' && !(automatic_add_tag_bool === undefined) && automatic_add_tag_bool == true) {
                Zotero.debug('ZoteroTag: first try')
                
                Zotero.ZoteroTag.updateItems(Zotero.Items.get(ids), 'add', Zotero.ZoteroTag.getTagByAuto());
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
    // keyset: {},

    initKeys: function() {
        let shortcuts = [];
        // init shortcuts
        for(let i=0; i<=9; i++){
            shortcuts.push({
                id: String(i),
                operation: 'add',
                group: i,
                modifiers: 'control',
                key: String(i),
            });
            shortcuts.push({
                id: String(i+10),
                operation: 'remove',
                group: i,
                modifiers: 'alt',
                key: String(i),
            });
        }
        let keyset = document.createElement('keyset');
        keyset.setAttribute('id', 'zoterotag-keyset');

        for (let i in shortcuts) {
            keyset.appendChild(Zotero.ZoteroTag.createKey(shortcuts[i]));
        }
        document.getElementById('mainKeyset').parentNode.appendChild(keyset);
    },
    createKey: function(keyObj) {
        let key = document.createElement('key');
        key.setAttribute('id', 'zoterotag-key-'+keyObj.id);
        // Zotero.ZoteroTag.keyset.appendChild(key);
        // Set label attribute so that keys show up nicely in keyconfig
        // extension
        // key.setAttribute('label', 'Zutilo: ' + Zutilo.keys.keyName(keyLabel));
        // key.setAttribute('command', 'zutilo-keyset-command');
        key.setAttribute('oncommand', '//');
        key.addEventListener('command', function() {
            try {
                Zotero.ZoteroTag.updateSelectedItems(keyObj.operation, keyObj.group);
            } catch (error) {
                Zotero.ZoteroTag.showProgressWindow('ERROR', 'Zotero Tag: Fail to add/remove tags.', 'fail');
            }
        });

        if (keyObj.modifiers) {
            key.setAttribute('modifiers', keyObj.modifiers);
        }
        if (keyObj.key) {
            key.setAttribute('key', keyObj.key);
        } else if (keyObj.keycode) {
            key.setAttribute('keycode', keyObj.keycode);
        } else {
            // No key or keycode.  Set to empty string to disable.
            key.setAttribute('key', '');
        }
        return key;
    },
    resetState: function() {
        // Reset state for updating items.
        Zotero.ZoteroTag.current = -1;
        Zotero.ZoteroTag.toUpdate = 0;
        Zotero.ZoteroTag.itemsToUpdate = null;
        Zotero.ZoteroTag.numberOfUpdatedItems = 0;
    },
    updateSelectedEntity: function(operation='add', group=1) {
        Zotero.debug('ZoteroTag: Updating items in entity');
        if (!ZoteroPane.canEdit()) {
            ZoteroPane.displayCannotEditLibraryMessage();
            return;
        }

        var collection = ZoteroPane.getSelectedCollection(false);

        if (collection) {
            Zotero.debug("ZoteroTag: Updating items in entity: Is a collection == true")
            var items = [];
            collection.getChildItems(false, false).forEach(function (item) {
                items.push(item);
            });
            suppress_warnings = true;
            Zotero.ZoteroTag.updateItems(items, operation, Zotero.ZoteroTag.getTagByGroup(group));
        }
    },
    updateSelectedItems: function(operation='add', group=1) {
        Zotero.debug('ZoteroTag: Updating Selected items');
        
        Zotero.ZoteroTag.updateItems(ZoteroPane.getSelectedItems(), operation, Zotero.ZoteroTag.getTagByGroup(group));
    },
    updateAll: function() {
        Zotero.debug('ZoteroTag: Updating all items in Zotero')
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
        Zotero.ZoteroTag.updateItems(items, 'add', Zotero.ZoteroTag.getTagByGroup(1));
    },
    updateItems: function(items, operation, tags) {
        // If we don't have any items to update, just return.
        Zotero.debug('ZoteroTag: Updating items: ' + JSON.stringify(items))
        // Object.keys(items).forEach(function(key){
        // 	Zotero.debug(items[key])
        // });

        items.forEach(function (val, idx) {
            Zotero.debug(val);
            Zotero.ZoteroTag.updateItem(val, operation, tags);
        })
        Zotero.ZoteroTag.showProgressWindow('SUCCESS', `${operation} ${tags.length>3?String(tags.length)+' tags':tags} ${operation==='add'?'to':'from'} ${items.length} items.`)
    },
    updateItem: function(item, operation, tags) {
        Zotero.debug('ZoteroTag: Updating item: ' + JSON.stringify(item));
        Zotero.debug(operation, tags)
        for (let i = 0; i < tags.length; ++i) {
            if(operation === 'add'){
                item.addTag(tags[i], 1);
            }
            else if (operation === 'remove'){
                item.removeTag(tags[i]);
            }
            item.saveTx();
        }
    },
    progressWindowIcon: {
        'success': "chrome://zotero/skin/tick.png",
        'fail': "chrome://zotero/skin/cross.png",
    },
    showProgressWindow: function(header, context, type="success") {
        // Zotero.ZoteroTag.progressWindow.close();
        let progressWindow = new Zotero.ProgressWindow({closeOnClick:true});
        progressWindow.changeHeadline(header);
        progressWindow.progress = new progressWindow.ItemProgress(Zotero.ZoteroTag.progressWindowIcon[type], context);
        progressWindow.show();
        progressWindow.startCloseTimer(5000);
    }
};

window.addEventListener('add', Zotero.ZoteroTag.init(), false);

window.addEventListener('load', function(e) {
    Zotero.ZoteroTag.init();
}, false);
