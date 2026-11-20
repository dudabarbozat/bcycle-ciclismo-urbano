import type { Alerta, RotaCompartilhada } from "./estado";

/* Conteúdo de exemplo da comunidade. Pessoas, relatos e dicas são fictícios; os locais são reais
   (pontos sobre ciclovias e ciclofaixas mapeadas no OpenStreetMap). Distâncias calculadas no BRouter,
   perfil "Mais segura", em 20/11/2026. */

const hoje = new Date("2026-11-20T12:00:00-03:00");
const diasAtras = (n: number) => new Date(hoje.getTime() - n * 86400000).toISOString();

export const ALERTAS_EXEMPLO: Alerta[] = [
  {
    id: "ex-a1", tipo: "buraco", lat: -23.54874, lon: -46.65184,
    texto: "Buraco grande na ciclofaixa da Consolação, perto do cruzamento. De noite quase não dá pra ver.",
    autor: "Marcelo R.", data: diasAtras(1), confirmacoes: 4, resolvido: false, exemplo: true,
  },
  {
    id: "ex-a2", tipo: "obra", lat: -23.566, lon: -46.64474,
    texto: "Obra de calçada ocupando a faixa na 13 de Maio. Tem que descer da bike por uns 50 m.",
    autor: "Carla M.", data: diasAtras(2), confirmacoes: 2, resolvido: false, exemplo: true,
  },
  {
    id: "ex-a3", tipo: "arvore", lat: -23.55128, lon: -46.67761,
    texto: "Galho caído na Ciclovia Sumaré depois da chuva de ontem.",
    autor: "Rafa T.", data: diasAtras(0), confirmacoes: 6, resolvido: false, exemplo: true,
  },
  {
    id: "ex-a4", tipo: "escuro", lat: -23.57541, lon: -46.64153,
    texto: "Postes apagados no trecho da Bernardino de Campos. Vá com farol.",
    autor: "Jéssica P.", data: diasAtras(4), confirmacoes: 3, resolvido: false, exemplo: true,
  },
  {
    id: "ex-a5", tipo: "alagamento", lat: -23.56545, lon: -46.68029,
    texto: "Poça grande na Rebouças quando chove forte. Hoje já secou.",
    autor: "Thiago L.", data: diasAtras(6), confirmacoes: 1, resolvido: true, exemplo: true,
  },
];

export const ROTAS_EXEMPLO: RotaCompartilhada[] = [
  {
    id: "ex-r1", nome: "Paulista de ponta a ponta",
    dica: "Ciclovia no canteiro central quase o caminho todo. Domingo a avenida fecha para carros e fica ainda melhor.",
    autor: "Marcelo R.", de: { lat: -23.5711, lon: -46.6449, nome: "Praça Oswaldo Cruz" }, para: { lat: -23.556, lon: -46.662, nome: "Rua da Consolação" },
    perfil: "safety", metros: 2494, subida: 26, curtidas: 41, data: diasAtras(3), exemplo: true,
  },
  {
    id: "ex-r2", nome: "MASP até o Ibirapuera",
    dica: "Descida tranquila. Na volta a subida pesa, então guarde fôlego. Tem bicicletário no portão 10.",
    autor: "Carla M.", de: { lat: -23.5614, lon: -46.6559, nome: "MASP" }, para: { lat: -23.5874, lon: -46.6576, nome: "Parque Ibirapuera" },
    perfil: "safety", metros: 4147, subida: 11, curtidas: 28, data: diasAtras(5), exemplo: true,
  },
  {
    id: "ex-r3", nome: "Paulista ao Centro pela Consolação",
    dica: "Ciclofaixa na descida da Consolação. Atenção nos cruzamentos com ônibus virando.",
    autor: "Rafa T.", de: { lat: -23.556, lon: -46.662, nome: "Rua da Consolação" }, para: { lat: -23.5437, lon: -46.6425, nome: "Praça da República" },
    perfil: "safety", metros: 2865, subida: 3, curtidas: 17, data: diasAtras(8), exemplo: true,
  },
  {
    id: "ex-r4", nome: "Paraíso até a Liberdade pela Vergueiro",
    dica: "Caminho que faço para o trabalho. Ciclofaixa contínua e plana.",
    autor: "Jéssica P.", de: { lat: -23.5755, lon: -46.6407, nome: "Metrô Paraíso" }, para: { lat: -23.5555, lon: -46.6355, nome: "Praça da Liberdade" },
    perfil: "safety", metros: 2678, subida: 3, curtidas: 12, data: diasAtras(10), exemplo: true,
  },
];
