# Zotero Tag
This is an add-on for [Zotero](https://www.zotero.org/) that enables automatic add tags for items.

# Quick Start Guide

#### Install
- Download the latest release (.xpi file) from the [Releases Page](https://github.com/windingwind/zotero-tag/releases)
*Note* If you're using Firefox as your browser, right click the xpi and select "Save As.."
- In Zotero click "Tools" in the top menu bar and then click "Addons"
- Go to the Extensions page and then click the gear icon in the top right.
- Select Install Add-on from file.
- Browse to where you downloaded the .xpi file and select it.
- Restart Zotero, by clicking "restart now" in the extensions list where the
scihub plugin is now listed.

#### Usage
Once you have the plugin installed simply, right click any item in your collections.
There will now be a new context menu option titled "Update Tag". Once you
click this, tags will be added to selected items or collections. 

For any new papers you add after this plugin is installed, the plugin will automatically add tags.

Settings can be found in the Preference menu.


## Building

Invoke make with the VERSION variable set in the environment. For example:

````
VERSION=0.0.1 make
````

Alternatively, version numbers can be passed to make directly:

````
make VERSION=0.0.2
````

## Disclaimer
Use this code at your own peril. No warranties are provided. Keep the laws of your
locality in mind!

This repo is created based on the code of [zotero-scihub](https://github.com/ethanwillis/zotero-scihub)
