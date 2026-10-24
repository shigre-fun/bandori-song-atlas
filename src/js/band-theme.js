// Representative colors and single motifs sampled from the official Artist backgrounds.
export const BAND_THEMES = [
  ["Poppin'Party", "poppinparty", "ポピパ", "#ff648f"],
  ["Afterglow", "afterglow", "アフグロ", "#f05664"],
  ["Pastel＊Palettes", "pastel-palettes", "パスパレ", "#3fe0af"],
  ["Roselia", "roselia", "ロゼリア", "#858fe5"],
  ["ハロー、ハッピーワールド！", "hello-happy-world", "ハロハピ", "#ffc637"],
  ["Morfonica", "morfonica", "モニカ", "#5fbbff"],
  ["RAISE A SUILEN", "raise-a-suilen", "RAS", "#41d0d0"],
  ["MyGO!!!!!", "mygo", "MyGO!!!!!", "#61a1c8"],
  ["Ave Mujica", "avemujica", "Ave Mujica", "#a2446c"],
  ["夢限大みゅーたいぷ", "yumemita", "ゆめみた", "#ef909f"],
  ["millsage", "millsage", "millsage", "#bb52f0"],
  ["一家Dumb Rock!", "ikka-dumb-rock", "一家DR!", "#ffbb5f"],
].map(([name, id, shortName, color]) => ({ name, id, shortName, color }));
export const OTHER_BAND = {
  name: "その他",
  shortName: "その他",
  color: "#79859c",
  id: null,
};
export function bandTheme(band = "") {
  const exact = BAND_THEMES.find((theme) => theme.name === band);
  if (exact) return exact;
  if (BAND_THEMES.filter((theme) => band.includes(theme.name)).length > 1)
    return OTHER_BAND;
  return (
    BAND_THEMES.find(
      (theme) =>
        band.startsWith(theme.name + "×") || band.startsWith(theme.name + " ×"),
    ) || OTHER_BAND
  );
}
