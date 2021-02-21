COMPILE_TIME=$(shell date +"%Y-%m-%d %H:%M:%S")
all: builddir clean
ifdef VERSION
	awk '/em:version=/ { $$0="      em:version=\"${VERSION}\""} { print }' install.rdf > install.rdf.temp && mv install.rdf.temp install.rdf
	awk '/<em:updateLink>/ { $$0="                <em:updateLink>https://github.com/windingwind/zotero-tag/releases/download/v${VERSION}/zotero-tag-${VERSION}.xpi</em:updateLink>"} { print }' update.rdf > update.rdf.temp && mv update.rdf.temp update.rdf
	awk '/<!ENTITY zotero.zoterotag.help.version.label/ { $$0="<!ENTITY zotero.zoterotag.help.version.label \"ZoteroTag 版本 ${VERSION}\">"} { print }' chrome/locale/zh-CN/overlay.dtd > chrome/locale/zh-CN/overlay.dtd.temp && mv chrome/locale/zh-CN/overlay.dtd.temp chrome/locale/zh-CN/overlay.dtd
	awk '/<!ENTITY zotero.zoterotag.help.version.label/ { $$0="<!ENTITY zotero.zoterotag.help.version.label \"ZoteroTag VERSION ${VERSION}\">"} { print }' chrome/locale/en-US/overlay.dtd > chrome/locale/en-US/overlay.dtd.temp && mv chrome/locale/en-US/overlay.dtd.temp chrome/locale/en-US/overlay.dtd
	awk '/<!ENTITY zotero.zoterotag.help.releasetime.label/ { $$0="<!ENTITY zotero.zoterotag.help.releasetime.label \"${COMPILE_TIME}\">"} { print }' chrome/locale/zh-CN/overlay.dtd > chrome/locale/zh-CN/overlay.dtd.temp && mv chrome/locale/zh-CN/overlay.dtd.temp chrome/locale/zh-CN/overlay.dtd
	awk '/<!ENTITY zotero.zoterotag.help.releasetime.label/ { $$0="<!ENTITY zotero.zoterotag.help.releasetime.label \"${COMPILE_TIME}\">"} { print }' chrome/locale/en-US/overlay.dtd > chrome/locale/en-US/overlay.dtd.temp && mv chrome/locale/en-US/overlay.dtd.temp chrome/locale/en-US/overlay.dtd
	zip -r builds/zotero-tag-${VERSION}.xpi chrome/* chrome.manifest install.rdf
else
	$(error VERSION variable not defined. Please define it.)
endif

builddir:
	mkdir -p builds

clean:
	rm -f builds/*
