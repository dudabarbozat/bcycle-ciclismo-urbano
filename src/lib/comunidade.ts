import type { Alerta, RotaCompartilhada } from "./estado";

/* Conteúdo de exemplo da comunidade. Pessoas e relatos são fictícios; os locais são reais
   (alertas sobre ciclovias mapeadas no OpenStreetMap). Distância, subida e percentual em ciclovia
   das rotas foram calculados no BRouter, perfil "Mais segura", em 20/11/2026. */

const hoje = new Date("2026-11-20T12:00:00-03:00");
const diasAtras = (n: number) => new Date(hoje.getTime() - n * 86400000).toISOString();

export const ALERTAS_EXEMPLO: Alerta[] = [
  {
    id: "ex-a1", tipo: "buraco", lat: -25.43026, lon: -49.29205,
    texto: "Buraco na ciclovia da Padre Anchieta. De noite quase não dá pra ver.",
    autor: "Marcelo R.", data: diasAtras(1), confirmacoes: 4, resolvido: false, exemplo: true,
  },
  {
    id: "ex-a2", tipo: "obra", lat: -25.42284, lon: -49.31404,
    texto: "Obra ocupando a ciclovia da Cândido Hartmann. Tem que descer da bike por um trecho curto.",
    autor: "Carla M.", data: diasAtras(2), confirmacoes: 2, resolvido: false, exemplo: true,
  },
  {
    id: "ex-a3", tipo: "arvore", lat: -25.44062, lon: -49.3064,
    texto: "Galho caído na Ciclovia Batel Parque Barigui depois da chuva.",
    autor: "Rafa T.", data: diasAtras(0), confirmacoes: 6, resolvido: false, exemplo: true,
  },
  {
    id: "ex-a4", tipo: "escuro", lat: -25.3872, lon: -49.30262,
    texto: "Postes apagados na ciclovia da Fredolin Wolf. Vá com farol.",
    autor: "Jéssica P.", data: diasAtras(4), confirmacoes: 3, resolvido: false, exemplo: true,
  },
  {
    id: "ex-a5", tipo: "alagamento", lat: -25.40095, lon: -49.33394,
    texto: "Poça grande na Manoel Ribas quando chove forte. Hoje já secou.",
    autor: "Thiago L.", data: diasAtras(6), confirmacoes: 1, resolvido: true, exemplo: true,
  },
];

export const ROTAS_EXEMPLO: RotaCompartilhada[] = [
  {
    id: "ex-r1", nome: "Almirante Tamandaré até o Centro de Curitiba",
    dica: "Uns 18 km e quase metade em ciclovia, mas a parte de Tamandaré não tem nenhuma. Saia cedo e conte com 113 m de subida no total.",
    autor: "Marcelo R.", de: { lat: -25.3133, lon: -49.2998, nome: "Centro de Almirante Tamandaré" }, para: { lat: -25.4285, lon: -49.2711, nome: "Praça Tiradentes" },
    perfil: "safety", metros: 18039, subida: 113, curtidas: 34, data: diasAtras(2), exemplo: true,
  },
  {
    id: "ex-r2", nome: "Parque Tanguá até o Parque Barigui",
    dica: "Passeio de parque a parque, mais de 60% em ciclovia. Bom para domingo.",
    autor: "Carla M.", de: { lat: -25.3797, lon: -49.285, nome: "Parque Tanguá" }, para: { lat: -25.4284, lon: -49.3065, nome: "Parque Barigui" },
    perfil: "safety", metros: 8785, subida: 65, curtidas: 27, data: diasAtras(5), exemplo: true,
  },
  {
    id: "ex-r3", nome: "Passeio Público até o Parque Barigui",
    dica: "Mais de 80% do caminho em ciclovia. Tem estação da Tembici no Barigui para quem vai sem bike própria.",
    autor: "Rafa T.", de: { lat: -25.4253, lon: -49.2673, nome: "Passeio Público" }, para: { lat: -25.4284, lon: -49.3065, nome: "Parque Barigui" },
    perfil: "safety", metros: 9052, subida: 55, curtidas: 19, data: diasAtras(8), exemplo: true,
  },
  {
    id: "ex-r4", nome: "Praça Tiradentes até o Jardim Botânico",
    dica: "Curtinha e quase plana, com 80% em ciclovia. Dá para ir depois do trabalho.",
    autor: "Jéssica P.", de: { lat: -25.4285, lon: -49.2711, nome: "Praça Tiradentes" }, para: { lat: -25.4417, lon: -49.2387, nome: "Jardim Botânico" },
    perfil: "safety", metros: 5344, subida: 20, curtidas: 15, data: diasAtras(10), exemplo: true,
  },
];
