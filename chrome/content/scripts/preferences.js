initPreferences = function() {
    // tag_name = Zotero.ZoteroTag.tag_name();
    // automatic_add_tag_bool = Zotero.ZoteroTag.automatic_add_tag();

    // // Apply setting to
    // document.getElementById('id-zoterotag-automatic-add-tag').checked = automatic_add_tag_bool
    // document.getElementById('id-zoterotag-tag-name').value = tag_name

    let rules = Zotero.ZoteroTag.rules();
    Zotero.debug("ZoteroTag: Initialize preferences.");
    Zotero.debug(rules);
    refreshPreferencesView(rules);
};

resetPreferences = function() {
    Zotero.debug("ZoteroTag: Reset preferences.");
    let rules = Zotero.ZoteroTag.resetRules();
    Zotero.debug(rules);
    refreshPreferencesView(rules);
    Zotero.ZoteroTag.showProgressWindow('SUCCESS', 'ZoteroTag rules reset.')
}

addRule = function() {
    Zotero.debug("ZoteroTag: Add rule.");
    let rule = {};
    rule.id = -1;
    rule.tags = document.getElementById('zoterotag-rules-#-tags').value.replace(/\s/g,"").split(',');
    rule.autoadd = document.getElementById('zoterotag-rules-#-autoadd').checked;
    rule.group = document.getElementById('zoterotag-rules-#-group').value;
    Zotero.debug(rule);
    let rules = Zotero.ZoteroTag.addRule(rule);
    refreshPreferencesView(rules);
    Zotero.ZoteroTag.showProgressWindow('SUCCESS', 'New ZoteroTag rule modification saved.')
}

refreshRule = async function(id) {
    Zotero.debug("ZoteroTag: Refresh rule.");
    let rule = {};
    rule.id = Number(id);
    rule.tags = await document.getElementById(`zoterotag-rules-${id}-tags`).value.replace(/\s/g,"").split(',');
    rule.autoadd = await document.getElementById(`zoterotag-rules-${id}-autoadd`).checked;
    rule.group = await document.getElementById(`zoterotag-rules-${id}-group`).value;
    Zotero.debug(rule);
    let rules = Zotero.ZoteroTag.replaceRule(rule, id);
    refreshPreferencesView(rules);
    Zotero.ZoteroTag.showProgressWindow('SUCCESS', 'ZoteroTag rule modification updated.')
}

removeRule = function(id) {
    Zotero.debug("ZoteroTag: Refresh rule.");
    let rules = Zotero.ZoteroTag.removeRule(id);
    refreshPreferencesView(rules);
    Zotero.ZoteroTag.showProgressWindow('SUCCESS', 'ZoteroTag rule removed.')
}

refreshPreferencesView = function(rules) {
    let listbox = document.getElementById("zoterotag-rules-listbox");
    let e, es = document.getElementsByTagName("listitem");
    while(es.length>0){
        e = es[0];
        e.parentElement.removeChild(e);
    }
    listbox.removeChild
    for(let key in rules){
        listbox.appendChild(creatRuleListElement(rules[key]));
    }
    listbox.appendChild(creatRuleBlankListElement());
    // Zotero.ZoteroTag.showProgressWindow('SUCCESS', 'ZoteroTag preference view updated.')
};

creatRuleBlankListElement = function() {
    let rule = {
        'id': '#',
        'tags': ['MODIFY HERE'],
        'autoadd': false,
        'color': 'red',
        'group': 1,
        'addcmd': 'addRule()',
        'addtext': '➕',
        'hideRemove': true,
    };
    return creatRuleListElement(rule);
}

creatRuleListElement = function(rule) {
    let listIDHead = "zoterotag-rules";
    let listitem, listcell, label, textbox, menulist, menupopup, menuitem, checkbox, button;
    
    listitem = document.createElement("listitem");
    listitem.setAttribute("id", `${listIDHead}-${rule.id}`);
    listitem.setAttribute("allowevents", "true");

    listcell = document.createElement("listcell");
    label = document.createElement("label");
    label.setAttribute("id", `${listIDHead}-${rule.id}-id`);
    label.setAttribute("value", rule.id);
    listcell.appendChild(label);
    listitem.appendChild(listcell);

    listcell = document.createElement("listcell");
    textbox = document.createElement("textbox");
    textbox.setAttribute("id", `${listIDHead}-${rule.id}-tags`);
    textbox.setAttribute("value", `${rule.tags}`);
    textbox.setAttribute("style", "width: 240px");
    listcell.appendChild(textbox);
    listitem.appendChild(listcell);

    listcell = document.createElement("listcell");
    menulist = document.createElement("menulist");
    menulist.setAttribute("id", `${listIDHead}-${rule.id}-group`);
    menupopup = document.createElement("menupopup");
    let menuValueList = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    let menuLabelList = ["1(default)*", "2*", "3*", "4", "5", "6", "7", "8", "9"];
    for(let i=0; i<menuValueList.length; i++){
        menuitem = document.createElement("menuitem");
        menuitem.setAttribute("value", menuValueList[i]);
        menuitem.setAttribute("label", menuLabelList[i]);
        if(menuLabelList[i][menuLabelList[i].length-1]==='*'){
            menuitem.setAttribute("style", "color: green");
        }
        menupopup.appendChild(menuitem);
    }
    menulist.setAttribute("value", `${rule.group}`);
    menulist.appendChild(menupopup);
    listcell.appendChild(menulist);
    listitem.appendChild(listcell);

    listcell = document.createElement("listcell");
    checkbox = document.createElement("checkbox");
    checkbox.setAttribute("id", `${listIDHead}-${rule.id}-autoadd`);
    checkbox.setAttribute("checked", `${rule.autoadd}`);
    listcell.appendChild(checkbox);
    listitem.appendChild(listcell);

    listcell = document.createElement("listcell");
    button = document.createElement("button");
    button.setAttribute("label", rule.addtext?rule.addtext:"✅");
    button.setAttribute("tooltiptext", "Add/Refresh Rule");
    button.setAttribute("oncommand", rule.addcmd?rule.addcmd:`refreshRule("${rule.id}")`);
    listcell.appendChild(button);
    // listitem.appendChild(listcell);

    // listcell = document.createElement("listcell");
    if(!rule.hideRemove){
        button = document.createElement("button");
        button.setAttribute("label", rule.removetext?rule.removetext:"⛔");
        button.setAttribute("tooltiptext", "Remove Rule");
        button.setAttribute("oncommand", rule.removecmd?rule.removecmd:`removeRule("${rule.id}")`);
        listcell.appendChild(button);
    }
    listitem.appendChild(listcell);

    return listitem;
};
