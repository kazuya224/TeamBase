export const getBaseLabel = (base: number): string => {
  if (base === 0 || base === 4) return "本塁";
  return `${base}塁`;
};

