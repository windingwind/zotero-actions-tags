# ![ZoteroTag](https://github.com/windingwind/zotero-tag/raw/master/chrome/skin/default/zoterotag/favicon.png)Zotero Tag

*One add-on to rule Tags all.*  
Manage all your Tags in one [Zotero](https://www.zotero.org/) add-on.
- Automatically add `/unread` tag for new items and remove `/unread` after read
- Support batch processing with tags
- Manage tags with custom rules


# Quick Start Guide

## Install
- Download the latest release (.xpi file) from the [Releases Page](https://github.com/windingwind/zotero-tag/releases)  
*Note* If you're using Firefox as your browser, right click the xpi and select "Save As.."
- In Zotero click "Tools" in the top menu bar and then click "Addons"
- Go to the Extensions page and then click the gear icon in the top right.
- Select Install Add-on from file.
- Browse to where you downloaded the .xpi file and select it.
- Restart Zotero, by clicking "restart now" in the extensions list where the plugin is now listed.

## Usage
Once you have the plugin installed simply, right click any item in your collections.
There will now be a new context menu option titled "Update Tag". Once you
click this, `auto-tag` tags(default `/unread`) will be added to selected items or collections. 

`auto-tag` tags will be added to new items; `aoto-read` tags will be removed after first attachments(pdf) open. If a tag has both `auto-tag` and `aoto-read`, it can work as an *unread* mark.

Since v0.1.4, right-click menu have new changes. Add/remove groups are dumped. New command allows you to modify tags on multiple items without changing rule settings.

![right-click](imgs/readme-settings-rightclickmenu.png)

Since v0.1.2, `auto-read` tags after read is supported. For previous users, auto-add tags will be removed after read by default. If you don't want this behavior, please modify rules in the Preference menu.

Settings can be found in the Preference menu.

## Settings
- Manage rules  
Use rules to control your tag strategies.  
Rules with *Auto-Add* checked will be added automatically once new items are added to your library.  
![rules](imgs/readme-settings-rule.png)   

- Shortcut keys   
Alt+(1-9) for adding/removing tag Group (1-9)  
Alt+0 for adding/removing *Auto-Add* tags  
![rules](imgs/readme-settings-shortcuts.png)

- Colorize tags for better experience  
[Colorize Guide](./docs/tag-color.md)  

## Building

Invoke make with the VERSION variable set in the environment. For example:

````
VERSION=0.0.1 make
````

Alternatively, version numbers can be passed to make directly:

````
make VERSION=0.0.1
````

## Disclaimer
Use this code under AGPL License. No warranties are provided. Keep the laws of your
locality in mind!

Part of the code of this repo refers to other open-source projects within the allowed scope.
- zotero-scihub
- Jusminum

## My Other Zotero Add-ons
- [Zotero PDF Translate](https://github.com/windingwind/zotero-pdf-translate)
