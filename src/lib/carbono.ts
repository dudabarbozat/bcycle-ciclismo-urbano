/* Emissão que um carro teria feito no mesmo percurso.
   Fonte: UK Department for Energy Security and Net Zero (DESNZ), Greenhouse gas reporting:
   conversion factors 2025, planilha "flat format", Passenger vehicles > Cars (by size) > Average car,
   por km, kg CO2e (emissão direta, escopo 1). É a média da frota do Reino Unido: o Brasil não
   publica um fator oficial equivalente por km, e a gasolina brasileira tem etanol misturado,
   então o número aqui é uma referência, não uma medição. */

export const FATORES = {
  medio: { rotulo: "Carro médio, combustível não informado", kgPorKm: 0.16725 },
  gasolina: { rotulo: "Carro médio a gasolina", kgPorKm: 0.16272 },
} as const;

export const FONTE_FATOR =
  "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025";

export function co2Evitado(metros: number, fator: keyof typeof FATORES): number {
  return (metros / 1000) * FATORES[fator].kgPorKm;
}

export function formatarKg(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${kg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}
