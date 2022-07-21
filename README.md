# ![ZoteroTag](addon/chrome/skin/default/zoterotag/favicon.png)Zotero Tag

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
Once you have the plugin installed simply, right click any item in your collections to add/remove tags in batch.

![right-click](imgs/readme-settings-rightclickmenu.png)

Auto-tag settings can be found in the Preference menu.

## Settings
- Manage rules  
Use rules to control your tag strategies.  
Set `Actions` for tag groups to add/remove tags when the action is triggered.  
For example, if you want to tag new items `/unread` and remove the unread tags after finish reading and close the file, please add two rules containing the `/unread` tag with theses two actions:
    - add on item add  
    - remove on item close  

![rules](imgs/readme-settings-rule.png)   

- Shortcut keys   
Alt+(1-9) for adding/removing tag Group (1-9)  
![rules](imgs/readme-settings-shortcuts.png)

- Colorize tags for better experience  
[Colorize Guide](./docs/tag-color.md)  

- Rate items with stars  
[Setting Guide](./docs/item-star.md)  
![image](https://user-images.githubusercontent.com/33902321/159643528-9eb77420-9c93-4244-b6e5-f9720af7698e.png)  

## Building

This addon is created based on the [Zotero addon template](https://github.com/windingwind/zotero-pdf-translate#development).  

````shell
git@github.com:windingwind/zotero-tag.git
cd zotero-tag
npm i
# Only build a .xpi
npm run build
# Release to github
npm run release
````

## Disclaimer
Use this code under AGPL License. No warranties are provided. Keep the laws of your
locality in mind!

Part of the code of this repo refers to other open-source projects within the allowed scope.
- zotero-scihub
- Jusminum

## My Other Zotero Add-ons
- [zotero-pdf-preview](https://github.com/windingwind/zotero-pdf-preview): PDF preview for Zotero
- [zotero-better-notes](https://github.com/windingwind/zotero-better-notes): Everything about note management. All in Zotero.
- [Zotero-pdf-translate](https://github.com/windingwind/zotero-pdf-translate/): PDF translation add-on for Zotero 6
