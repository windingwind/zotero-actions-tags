all: builddir clean
ifdef VERSION
	awk '/em:version=/ { $$0="      em:version=\"${VERSION}\""} { print }' install.rdf > install.rdf.temp && mv install.rdf.temp install.rdf
	awk '/<em:updateLink>/ { $$0="                <em:updateLink>https://github.com/windingwind/zotero-tag/releases/download/v${VERSION}/zotero-tag-${VERSION}.xpi</em:updateLink>"} { print }' update.rdf > update.rdf.temp && mv update.rdf.temp update.rdf
	zip -r builds/zotero-tag-${VERSION}.xpi chrome/* chrome.manifest install.rdf
else
	$(error VERSION variable not defined. Please define it.)
endif

builddir:
	mkdir -p builds

clean:
	rm -f builds/*
