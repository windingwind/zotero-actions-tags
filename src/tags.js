export default {
  getTagByGroup: function (group) {
    if (typeof group === "undefined") {
      return prompt("Enter tags, split by ',':", "")
        .replace(/\s/g, "")
        .split(",");
    }
    if (group === 0) {
      return Zotero.ZoteroTag.getTagByAuto();
    }
    let rules = Zotero.ZoteroTag.rules();
    let tags = [];
    for (let i = 0; i < rules.length; i++) {
      if (group === -1 || Number(rules[i].group) === group) {
        tags = tags.concat(rules[i].tags);
      }
    }
    return tags;
  },
  getTagByAuto: function (auto = true) {
    let rules = Zotero.ZoteroTag.rules();
    let tags = [];
    for (let i = 0; i < rules.length; i++) {
      if (rules[i].autoadd === auto) {
        tags = tags.concat(rules[i].tags);
      }
    }
    return tags;
  },
  getTagByRead: function (read = true) {
    let rules = Zotero.ZoteroTag.rules();
    let tags = [];
    for (let i = 0; i < rules.length; i++) {
      if (typeof rules[i].autoremove === "undefined") {
        rules[i].autoremove = rules[i].autoadd;
      }
      if (rules[i].autoremove === read) {
        tags = tags.concat(rules[i].tags);
      }
    }
    return tags;
  },
};
