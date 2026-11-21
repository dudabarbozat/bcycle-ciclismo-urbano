# BCYCLE — ciclismo urbano

App para quem usa a bicicleta no dia a dia: rotas mais seguras, pontos de apoio no caminho (bicicletários, oficinas, banheiros, água), alertas da comunidade e a pegada de carbono evitada.

**Demo:** https://dudabarbozat.github.io/bcycle-ciclismo-urbano/

Projeto de hackathon do Time 8, reconstruído em 2026 como protótipo navegável com dados reais do OpenStreetMap, ambientado em Curitiba e região metropolitana.

## Para quem

Ciclistas urbanos que se deslocam para o trabalho ou estudo e precisam saber por onde pedalar com segurança, onde deixar a bike e onde consertá-la.

## Funcionalidades

- **Mapa** de ciclovias e pontos de apoio, com filtros, lista por distância e ficha de cada lugar.
- **Rotas de bicicleta** em três perfis (mais segura, equilibrada, mais rápida), com percentual em ciclovia, trechos de atenção, altitude e curva a curva.
- **Navegação** pelo GPS, com aviso de alertas à frente.
- **Comunidade:** rotas compartilhadas, alertas na via e avaliações.
- **Pegada de carbono:** CO₂ que um carro emitiria no mesmo percurso.
- **Emergência:** atalhos para 192, 190 e 193, envio da localização e roteiro em caso de roubo.

## Stack

Next.js 15 (exportação estática) · React 19 · TypeScript · Leaflet

| Serviço | Uso |
|---------|-----|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) / [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) | Mapa, ciclovias e pontos de apoio |
| [BRouter](https://brouter.de/) | Roteamento para bicicleta com altitude |
| [Photon](https://photon.komoot.io/) | Busca de endereços |

Sem backend e sem chaves de API.

O fator de emissão é o do carro médio do governo do Reino Unido ([DESNZ 2025](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025)): 0,16725 kg CO₂e/km.

## Como rodar

```bash
npm ci
npm run dev
```

## Limitações do protótipo

Usuários, rotas compartilhadas e alertas são exemplos; os lugares são reais. Os dados criados ficam no navegador. Os planos do pitch liberam funções, sem cobrança.

## Equipe — Time 8

- Barbara Calmon — negócios e produto
- Daniel Ederli — back-end
- Eduarda Barboza — UX/UI
- Jhennifer Pimentel — marketing
- Jhulianna Santos — back-end

## Licença

Código sob [MIT](LICENSE). Dados © colaboradores do OpenStreetMap ([ODbL](https://opendatacommons.org/licenses/odbl/)).
