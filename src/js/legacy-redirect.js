const link = document.querySelector("#new-song-url, #new-creator-url");
if (link) {
  const target = new URL(link.href);
  target.search = location.search;
  target.hash = location.hash;
  location.replace(target.href);
}
