const icons: Record<string, string> = {};

export function getIcon(src: string) {
  if (icons[src]) return icons[src];
  const res = Zotero.HTTP.request("GET", src, {});
  res.then((r) => {
    icons[src] = r.response;
  });
  return res;
}
