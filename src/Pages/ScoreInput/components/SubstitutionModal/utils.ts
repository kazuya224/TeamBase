export const getInitialTeam = (
  currentTopBottom: "top" | "bottom"
): "home" | "away" => (currentTopBottom === "top" ? "away" : "home");

