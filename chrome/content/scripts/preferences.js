	initPreferences = function() {
		tag_name = Zotero.ZoteroTag.tag();
		automatic_add_tag_bool = Zotero.ZoteroTag.automatic_add_tag();

		// Apply setting to
		document.getElementById('id-zoterotag-automatic-add-tag').checked = automatic_add_tag_bool
		document.getElementById('id-zoterotag-tag-name').value = tag_name
	}
