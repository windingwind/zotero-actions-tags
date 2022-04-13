export default {
  getReader: function () {
    return Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
  },

  getWindowReader: function () {
    let windowReaders = [];
    let tabs = Zotero_Tabs._tabs.map((e) => e.id);
    for (let i = 0; i < Zotero.Reader._readers.length; i++) {
      let flag = false;
      for (let j = 0; j < tabs.length; j++) {
        if (Zotero.Reader._readers[i].tabID == tabs[j]) {
          flag = true;
          break;
        }
      }
      if (!flag) {
        windowReaders.push(Zotero.Reader._readers[i]);
      }
    }
    return windowReaders;
  },
};
