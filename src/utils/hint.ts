export { updateHint };

function updateHint(message: string) {
  new ztoolkit.ProgressWindow("Actions & Tags", {
    closeOnClick: true,
    closeOtherProgressWindows: true,
  })
    .createLine({ text: message, type: "default", progress: 100 })
    .show(5000);
}
