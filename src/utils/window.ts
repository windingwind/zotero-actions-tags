export { isWindowAlive, closeWindow };

/**
 * Check if the window is alive.
 * Useful to prevent opening duplicate windows.
 * @param win
 */
function isWindowAlive(win?: Window) {
  return win && !Components.utils.isDeadWrapper(win) && !win.closed;
}

function closeWindow(win: Window) {
  if (isWindowAlive(win)) {
    win.close();
  }
}
