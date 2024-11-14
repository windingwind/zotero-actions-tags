# ![Actions and Tags for Zotero](addon/chrome/content/icons/favicon.png)Actions and Tags for Zotero

[![zotero target version](https://img.shields.io/badge/Zotero-7-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

_Customize your Zotero workflow._

<img width="800" alt="image" src="https://github.com/windingwind/zotero-actions-tags/assets/33902321/05aa4dc2-4782-4ddf-84ea-949de96820a7">

## 🧩 Outline

[🧐 What is this?](#-what-is-this)

[👋 Install](#-install)

[😎 Quick start](#-quick-start)

[🔍 Advanced usage](#-advanced-usage)

[🔧 Development](#-development)

[🔔 Disclaimer](#-disclaimer)

[🔎 My Zotero Plugins](#-my-zotero-plugins)

[💰 Sponsor Me](#-sponsor-me)

[🫶 Sponsors](#-sponsors)

## 🧐 What is this?

_Actions & Tags_ (AT), also known as _Zotero Tag_, is a plugin for [Zotero](https://zotero.org).

AT can help you:

- Automatically tag items with our [actions](), triggered by Zotero events or user-defined shortcuts
- Automate your workflow with custom scripts!
  - [Replace tag](https://github.com/windingwind/zotero-actions-tags/discussions/113)
  - [Copy item link](https://github.com/windingwind/zotero-actions-tags/discussions/115)
  - [Auto-generate note when opening item](https://github.com/windingwind/zotero-actions-tags/discussions/108)
  - [Auto-translate new items' title/abstract](https://github.com/windingwind/zotero-actions-tags/discussions/107)
  - [Find out more →](https://github.com/windingwind/zotero-actions-tags/discussions/categories/action-scripts)

## 👋 Install

- Download the latest release (.xpi file) from:

  - [Latest Stable](https://github.com/windingwind/zotero-actions-tags/releases/latest)
  - [All Releases](https://github.com/windingwind/zotero-actions-tags/releases)

  _Note_: If you're using Firefox as your browser, right click the xpi and select "Save As.."

- In Zotero click "Tools" in the top menu bar and then click "Addons"
- Go to the Extensions page and then click the gear icon in the top right.
- Select Install Add-on from file.
- Browse to where you downloaded the .xpi file and select it.
- Restart Zotero, by clicking "restart now" in the extensions list where the plugin is now listed.

## 😎 Quick start

This plugin is designed to be easy to use. Start in **1 minutes**!

### Getting started with example: `unread`

We have prepared a simple example for you to get started. The example is called `unread`, which will tag the item with `unread` when you add it to the library (create, import, or from zotero-connector) and remove the tag when you close the item.

Steps:

- Have this plugin installed and download a paper into your Zotero client.
- The newly added item is tagged with `/unread`!
- Open the item and read it.
- Close the item and the tag is removed!

> Don't know where to find the tag? Check the "Tags" tab in the right panel. See also [Zotero Doc:adding tags to items](https://www.zotero.org/support/collections_and_tags#adding_tags_to_items)

### Create your own actions

Now that you have learned how to use the example, you can create your own actions!

Steps to open the list of actions:

- Open the settings (aka. preferences) page of this plugin. See [Zotero Doc:preferences](https://www.zotero.org/support/preferences) for more details.
- Click the "Actions & Tags" tab.

Now you can see a list of actions.

The community contributed some useful actions via `custom script`. Take an example of `copy item link`, You can use it by:

1. Create an action by clicking the "+" button. Set the operation to `customScript`, assign `shortcut` and `menu label`.

<img width="300" alt="image" src="https://github.com/windingwind/zotero-actions-tags/assets/33902321/9c327c8a-46d0-416c-b21a-95d4d021c9ea">

2. Copy the script from community: [[Share] Copy item link of the selected item](https://github.com/windingwind/zotero-actions-tags/discussions/115) -> data.

<img width="400" alt="image" src="https://github.com/windingwind/zotero-actions-tags/assets/33902321/fad3449a-13ac-4b13-bb19-efe537c4579d">

3. Paste the script to the `data` field of the action.

4. Click "Save" to save the action.

Great! Now you can use the action by:

- Right click the item in the library and select the action in the menu -> trigger action -> Copy item link.

- Use the shortcut you assigned to the action.

Check your clipboard and you will find the link of the item!

You can find more actions by searching [community](https://github.com/windingwind/zotero-actions-tags/discussions/categories/action-scripts).

### Action settings

An action has the following settings:

- **Event**: The event that triggers the action.

<details style="text-indent: 4em">
<summary>Show supported events</summary>

| Event              | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `createItem`       | Triggered when an item is created.                        |
| `openFile`         | Triggered when an item is opened.                         |
| `closeTab`         | Triggered when an item is closed.                         |
| `createAnnotation` | Triggered when an annotation is created.                  |
| `createNote`       | Triggered when a note is created.                         |
| `appendAnnotation` | Triggered when an annotation is appended to target item.  |
| `appendNote`       | Triggered when a note is appended to target item.         |
| `programStartup`   | Triggered when the Zotero client (or this plugin) starts. |
| `mainWindowLoad`   | Triggered when the main window is loaded.                 |
| `mainWindowUnload` | Triggered when the main window is unloaded (closed).      |

</details>

- **Operation**: The operation that the action will perform.

<details style="text-indent: 4em">
<summary>Show supported operations</summary>

| Operation      | Description                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| `addTag`       | Add tag(s) to the target item.                                                 |
| `removeTag`    | Remove tag(s) from the target item.                                            |
| `toggleTag`    | Add tag(s) to the target item if it doesn't have the tag, otherwise remove it. |
| `otherAction`  | Run other custom actions.                                                      |
| `customScript` | Run a custom script.                                                           |

</details>

- **Data**: The action data.

  - For tag operations, it's tags separated by comma
  - For custom script, it's the script code.
  - For trigger other actions, it's the target actions' names (each in one line).

  > Click `⤤` in the edit action popup to open editor for multi-line data.

- **Shortcut**: The shortcut that triggers the action. Leave it empty if you don't want to use a shortcut.

  > Click shortcut button in the edit action popup to record custom shortcut from keyboard.

- **Menu Label**: The label of the menu item to be displayed in the right-click menu in the library / reader popup menu.

  > Leave empty to hide in the menu.
  > Sort by the menu label alphabetically.

  - Item Menu  
    <img width="300" alt="image" src="https://github.com/windingwind/zotero-actions-tags/assets/33902321/c0b45172-82ec-450d-b578-0aeb2c33e7ea">
  - Collection Menu  
    <img width="300" alt="image" src="https://github.com/windingwind/zotero-actions-tags/assets/33902321/90e8f705-8d51-4485-81d9-af927e850200">
  - Tools Menu
  - Reader Menu  
    <img width="300" alt="image" src="https://github.com/windingwind/zotero-actions-tags/assets/33902321/d7ccbb74-5344-4604-aa84-36f624761c00">
  - Annotation Menu  
    <img width="300" alt="image" src="https://github.com/windingwind/zotero-actions-tags/assets/33902321/d1fa0cb9-4f40-46f7-bf75-9c1b19830955">

- **Enabled**: Whether the action is enabled. Uncheck it to disable the action.

## 🔍 Advanced usage

### Colorize your tags

You can colorize your tags by assigning a color to the tag in the tag selector. See [Zotero Doc:colored tags](https://www.zotero.org/support/collections_and_tags#colored_tags) for more details.

Use cases:

- Assign a color to the `/unread` tag so that you can easily find the unread items in your library.
- Assign colors to the `⭐️`, `⭐️⭐️`, `⭐️⭐️⭐️`, ... tags so that you can easily sort the items by their importance.

### Custom script

> ⚠️ **Warning**: Custom script is a powerful feature. It can do anything that you can do in the Zotero client. Use it with caution!
>
> All the scripts shared in the [community](https://github.com/windingwind/zotero-actions-tags/discussions/categories/action-scripts) will be manually reviewed by me to make sure it is not malicious. However, they may still cause data loss if you does not use them properly!
> Do not run the script that you do not trust!

You can run custom script with the `customScript` operation. The script will be executed in the context of the Zotero client.

Share & find custom scripts here: https://github.com/windingwind/zotero-actions-tags/discussions/categories/action-scripts

You can use the following variables in the script:

- `triggerType`: The trigger type. Can be `menu`, `shortcut`, `createItem`, `openFile`, `closeTab`, `createAnnotation`, `createNote`, `appendAnnotation`, `appendNote`, `programStartup`, `mainWindowLoad`, `mainWindowUnload`.

- `item`: The target item. Might be `null` if the action is triggered by an event that doesn't have a target item, e.g. shortcut in the Zotero client without selecting an item. (Not available in `programStartup`, `mainWindowLoad`, and `mainWindowUnload` event)

  <details style="text-indent: 4em">
  <summary>Examples with `item`</summary>

  - Get the title of the item: `item.getField('title')`. More details of the available fields can be found in [Zotero:item fields](https://api.zotero.org/itemFields?pprint=1)
  - Get the tags of the item: `item.getTags().map(tag => tag.tag)`
  - Add a tag to the item: `item.addTag('tag')`
  - Remove a tag from the item: `item.removeTag('tag')`

  </details>

- `items`: The target items[] array. Only available in menu/shortcut-triggered actions, otherwise it's `null`.

  When selecting multiple items in the library, the action will be triggered once for all items (`items=[...], item=undefined`) and then one by one for each item (`items=[], item=...`). You can use the `items` variable to get the selected items array and avoid duplicate executions.

  > Please always use the `items` instead of `ZoteroPane.getSelectedItems()`. The action can be triggered from entrances outside the library, where the items are not from `ZoteroPane`.

  <details style="text-indent: 4em">
  <summary>Examples with `items`</summary>

  ```js
  if (item) {
    // Disable the action if it's triggered for a single item to avoid duplicate operations
    return;
  }

  if (items?.length > 0) {
    // Do something with all selected items
  }
  ```

  </details>

- `collection`: The target collection object, is only available when triggered by the collection menu.

- `require`: The `require` function to import global variables. Use `const window = require('window')` to import the `window` variable.

  <details style="text-indent: 4em">
  <summary>Examples with `require`</summary>

  - Get selected items: `const selectedItems = require('ZoteroPane').getSelectedItems()`
  - Get the item of current tab:

    ```js
    const Zotero = require("Zotero");
    const Zotero_Tab = require("Zotero_Tab");
    const itemID = Zotero_Tabs._tabs[Zotero_Tabs.selectedIndex].data.itemID;
    const item = Zotero.Items.get(itemID);
    ```

  </details>

- `window`: Only available in `mainWindowLoad` and `mainWindowUnload` event. In other events, you should use `require('Zotero').getMainWindow()` to import the `window` variable.

## 🔧 Development

This plugin is built based on the [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template). See the setup and debug details there.

To startup, run

```bash
git clone https://github.com/windingwind/zotero-actions-tags.git
cd zotero-actions-tags
npm install
npm run build
```

The plugin is built to `./build/*.xpi`.

## 🔔 Disclaimer

Use this code under AGPL. No warranties are provided. Keep the laws of your locality in mind!

## 🔎 My Zotero Plugins

- [Better Notes for Zotero](https://github.com/windingwind/zotero-better-notes): Everything about note management. All in Zotero.
- [Translate for Zotero](https://github.com/windingwind/zotero-pdf-translate/): Translate PDF, EPub, webpage, metadata, annotations, notes to the target language. Support 20+ translate services.

## 💰 Sponsor Me

I'm windingwind, an active Zotero(https://www.zotero.org) plugin developer. Devoting to making reading papers easier.

Sponsor me to buy a cup of coffee. I spend more than 24 hours every week coding, debugging, and replying to issues in my plugin repositories. The plugins are open-source and totally free.

If you sponsor more than $10 a month, you can list your name/logo here and have priority for feature requests/bug fixes!

## 🙌 Sponsors

Thanks
[peachgirl100](https://github.com/peachgirl100), [Juan Gimenez](),
and other anonymous sponsors!

If you want to leave your name here, please email me or leave a message with the donation.
