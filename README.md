# bcycle-ciclismo-urbano

App para ciclistas urbanos: rotas de bicicleta mais seguras, estacionamentos e oficinas no caminho, alertas da comunidade na via e a pegada de carbono que você deixou de emitir. Usa dados reais do OpenStreetMap e roteamento próprio para bicicleta.

Demo: https://dudabarbozat.github.io/bcycle-ciclismo-urbano/

Portfólio pessoal. Projeto apresentado em hackathon pelo Time 8 e reconstruído em 2026 como protótipo navegável, com Next.js e APIs públicas.

## Contexto

- Problema: roubo de bicicletas e falta de lugares confiáveis para estacionar e consertar. Números citados no pitch para o estado de São Paulo: 13.563 roubos e furtos registrados em boletim em 2020, média de uma bike roubada a cada 40 minutos, 61% das vítimas sem seguro, cerca de 40% das bikes roubadas estavam presas com corrente, cabo ou cadeado.
- Persona (do pitch, ambientada em São Paulo): Marcelo, 32 anos, garçom. Tranca a bike no estande perto do trabalho com a melhor trava que encontrou e mesmo assim entrou para as estatísticas. Quer saber onde há estacionamento seguro e quais oficinas confiáveis ficam na sua rota.
- Proposta original: navegação curva a curva com altitude e um recurso de segurança que evita locais sem ciclovia e vias sem pavimento; mapa de oficinas, bicicletários, banheiros, bombas de ar, água e recarga de e-bike; rede coletiva com rotas favoritas, avaliações e avisos de obras, árvores caídas e buracos; cálculo da pegada de carbono pelos km pedalados.
- Modelo de negócio: Freemium (gratuito, captação de leads), Básico (a partir de R$ 5,40/mês: km por dia e avisos na rota) e Premium (valor sob consulta: rotas com relevo, mapa offline e rota personalizada pelo modo de pedalar).
- Equipe (Time 8):
  - Barbara Calmon (negócios e produto)
  - Daniel Ederli (desenvolvimento back-end)
  - Eduarda Barboza (UX/UI)
  - Jhennifer Pimentel (marketing)
  - Jhulianna Santos (desenvolvimento back-end)

## Funcionalidades

- Mapa com ciclovias e ciclofaixas (linha cheia e tracejada) e pontos de apoio por tipo: estacionamento, oficina e loja, bike compartilhada, banheiro, água, ar e recarga. Filtros por tipo, lista ordenada por distância e ficha de cada ponto com vagas, cobertura, tipo de paraciclo, horário, telefone e link para corrigir no OpenStreetMap.
- Busca ao vivo: fora da região gravada, o botão "Buscar nesta área" consulta o OpenStreetMap para a área visível (até cerca de 6 x 6 km), tentando três servidores públicos em sequência.
- Rota de bicicleta em três perfis do BRouter: mais segura (`safety`), equilibrada (`trekking`) e mais rápida (`fastbike`). O perfil inicial vem do jeito de pedalar escolhido no cadastro.
- Análise de segurança da rota: percentual em ciclovia ou ciclofaixa, em ruas comuns e em avenidas sem faixa; trechos de atenção (avenida principal sem faixa, piso sem asfalto) com a distância de cada um; alertas da comunidade a até 60 m do trajeto; pontos de apoio a até 120 m do trajeto, com o km em que aparecem.
- Perfil de altitude, curva a curva e tempo estimado.
- Navegação pelo GPS do aparelho (projeta a posição na rota, avisa quando sai dela e permite recalcular) ou simulada a 20 vezes a velocidade real. Durante o trajeto, aviso na tela quando há alerta da comunidade a 150 m.
- Comunidade: rotas compartilhadas com dica, curtidas e envio do link; alertas na via (buraco, obra, árvore caída, alagamento, trecho sem iluminação, roubo) com confirmação e "já foi resolvido"; avaliações com estrelas dos pontos de apoio.
- Pegada de carbono: km por dia na última semana, histórico de pedaladas e CO₂ que um carro emitiria no mesmo percurso.
- Emergência: atalhos para 192, 190 e 193, envio da localização pelo compartilhamento do celular, roteiro para quando a bike é roubada, dados da bike prontos para copiar no boletim de ocorrência e oficinas mais próximas.
- Planos do pitch: trocar de plano libera ou bloqueia funções (pegada no Básico, altitude no Premium). Não há cobrança.
- Estados de carregando, vazio e erro com nova tentativa; foco visível; os diálogos de alerta e de compartilhar fecham com Esc; textos alternativos nos marcadores; leitura por leitor de tela dos avisos e da próxima instrução de navegação.

## Telas

- `/` Início: saudação, atalhos do protótipo do pitch (pontos de apoio, mapa, emergência), pontos mais próximos, resumo da semana e alertas na região.
- `/mapa/` Mapa com filtros, lista, ficha do ponto, alertas e "Buscar nesta área". Aceita `?ponto=node/123`, `?alerta=id` e `?apoio=1`.
- `/rota/` Origem e destino com busca de endereço, perfis, análise, altitude, curva a curva, navegação e compartilhamento. Aceita `?de=lat,lon&deNome=…&para=lat,lon&nome=…&perfil=safety`.
- `/comunidade/` Rotas, alertas e avaliações.
- `/perfil/` Pegada de carbono, histórico, plano, jeito de pedalar, dados da bike e dados do navegador.
- `/emergencia/` Ligações, localização, roubo e oficinas.
- `/sobre/` Persona, números, diferenciais, roadmap, equipe, o que é real e créditos.

## Dados e APIs

| Serviço | Para quê | Chave |
|---------|----------|-------|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) via [Leaflet](https://leafletjs.com/) | Mapa base | Não |
| [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) | Pontos de apoio e ciclovias ao vivo. Servidores: `maps.mail.ru`, `overpass-api.de` e `overpass.private.coffee`, nessa ordem, 40 s cada | Não |
| [BRouter](https://brouter.de/) | Rota de bicicleta com altitude, instruções (`voicehints`) e tags de cada trecho (`messages`) | Não |
| [Photon](https://photon.komoot.io/) | Busca de endereços e lugares, priorizando os próximos da partida | Não |

Todas aceitam chamadas do navegador (CORS). Não há backend.

### Retrato gravado de Curitiba e Almirante Tamandaré

O protótipo está ambientado em Curitiba e em Almirante Tamandaré, na região metropolitana. Para a demonstração abrir rápido e não depender dos servidores públicos do Overpass, que costumam ficar sobrecarregados, `public/dados/` traz uma consulta feita em 20/11/2026 no recorte sul -25,455, oeste -49,335, norte -25,290, leste -49,225 (do Centro de Almirante Tamandaré ao Centro de Curitiba, passando pelo Tanguá e pelo Barigui):

- `pontos-curitiba.json`: 255 pontos (87 bicicletários, 49 banheiros, 48 lojas e oficinas, 48 estações de bike compartilhada, 21 bebedouros, 1 estação de reparo, 1 calibrador).
- `ciclovias-curitiba.json`: 1.111 trechos de ciclovia e ciclofaixa.

Em Almirante Tamandaré não há nenhuma ciclovia, ciclofaixa, bicicletário, oficina ou estação de bike no OpenStreetMap (consulta pela área do município em 20/11/2026, que encontrou 120 outros pontos cadastrados, como comércio e serviços). O app mostra essa lacuna em vez de escondê-la: a partir de Tamandaré, a tela inicial diz que não há nada mapeado a até 3 km e convida a pessoa a avisar a comunidade ou mapear o lugar.

As estações de bike compartilhada de Curitiba (operadas pela Tembici) estão marcadas no OpenStreetMap com a rede de outra cidade, por isso o app mostra só o operador.

Os arquivos mantêm o formato de resposta do Overpass, só com as tags usadas, então o mesmo conversor (`lib/osm.ts`) lê o retrato e a consulta ao vivo.

### Análise de segurança

Cada linha de `messages` do BRouter traz as tags do caminho e a distância percorrida nele (`lib/rota.ts`):

- Ciclovia ou ciclofaixa: `highway=cycleway`, `bicycle=designated` ou `cycleway*` igual a `lane`, `track`, `opposite_lane` ou `opposite_track`.
- Avenida sem faixa: `highway` igual a `primary`, `secondary` ou `trunk` (e os `_link`) sem nenhuma das tags acima.
- Sem asfalto: `surface` diferente de asfalto, concreto, paralelepípedo e similares.

Trechos de atenção com menos de 30 m somados são ignorados.

### Pegada de carbono

`CO₂ evitado = km pedalados × kg de CO₂e por km de um carro`.

Fator padrão: 0,16725 kg CO₂e/km ("Average car", combustível não informado). Alternativa: 0,16272 kg CO₂e/km (carro médio a gasolina). Fonte: UK Department for Energy Security and Net Zero, [Greenhouse gas reporting: conversion factors 2025](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025), planilha "flat format", Passenger vehicles > Cars (by size), por km, emissão direta. É a média da frota do Reino Unido: o Brasil não publica um fator oficial equivalente por km, e a gasolina brasileira tem etanol misturado. O app trata o número como referência.

## O que é simulado

- Pessoas, rotas compartilhadas, alertas e dicas de exemplo. Os locais são reais: os alertas ficam sobre ciclovias mapeadas e as distâncias das rotas de exemplo foram calculadas no BRouter (perfil "mais segura") em 20/11/2026.
- A navegação simulada percorre a rota a 360 km/h (20 vezes 18 km/h), para caber numa demonstração.
- O tempo até um ponto de apoio, fora da rota, é estimado a 15 km/h sobre a distância em linha reta acrescida de 30%.
- Planos e cobrança.
- Tudo o que a pessoa cria (perfil, pedaladas, avaliações, alertas, rotas, dados da bike) fica no `localStorage` do navegador e não é visto por mais ninguém. O Perfil tem "Restaurar exemplos" e "Apagar tudo".
- Ponto de partida padrão: Praça Tiradentes, no Centro de Curitiba. A tela inicial troca para o Centro de Almirante Tamandaré ou para a localização real. O GPS só é usado quando a pessoa pede.
- Não há mapa offline, apesar de constar no plano Premium do pitch.

## Visual

- Cores, degradê azul, vermelho de emergência, cartões arredondados e textos da tela inicial ("Olá, …", "Onde vamos pedalar hoje?", "Encontrar pontos de apoio", "Abrir mapa", "Emergência", "Perto de você") seguem as telas do pitch.
- Tipografia: Montserrat e Poppins (`@fontsource`), servidas junto com o app.
- Logo e ícone extraídos do PDF do pitch, em `public/img/`.
- Mapa base do OpenStreetMap com filtro CSS para o tema escuro.
- No desktop o app aparece dentro de uma moldura de celular, com um resumo do projeto ao lado.

## Stack

Next.js 15 (App Router, exportação estática), React 19, TypeScript estrito, CSS global. Dependências: `leaflet`, `@fontsource/montserrat`, `@fontsource/poppins`. Estado em `localStorage` com `useSyncExternalStore`.

## Como rodar

```
npm ci
npm run dev
```

Acesse http://localhost:3000. O GPS exige `localhost` ou HTTPS.

Build estático igual ao de produção:

```
NEXT_PUBLIC_BASE_PATH=/bcycle-ciclismo-urbano npm run build
```

A saída fica em `out/`. Para testar com o mesmo caminho do GitHub Pages, copie `out/` para `teste/bcycle-ciclismo-urbano/` e sirva `teste/` com `python -m http.server`.

## Publicação

`.github/workflows/pages.yml` roda a cada push na `main`: `npm ci`, build com `NEXT_PUBLIC_BASE_PATH=/bcycle-ciclismo-urbano` e deploy da pasta `out` no GitHub Pages. No repositório, em Settings > Pages, a fonte deve ser "GitHub Actions".

## Estrutura

```
src/app/                    rotas (início, mapa, rota, comunidade, perfil, emergencia, sobre), layout e globals.css
src/components/AppShell.tsx moldura, navegação inferior e cadastro na primeira visita
src/components/Mapa.tsx     Leaflet: ciclovias em canvas, pontos, alertas, rota e marcadores
src/components/telas/       telas
src/lib/osm.ts              retrato gravado, consulta ao Overpass e conversão das tags
src/lib/rota.ts             BRouter, instruções, análise de segurança e busca no Photon
src/lib/geo.ts              distâncias, ponto mais próximo numa linha e formatação
src/lib/carbono.ts          fator de emissão e cálculo
src/lib/estado.ts           estado local, planos e tipos de alerta
src/lib/comunidade.ts       rotas e alertas de exemplo
src/lib/localizacao.ts      GPS sob demanda
public/dados/               retrato do OpenStreetMap de Curitiba e Almirante Tamandaré
public/img/                 logo e ícones
```

## Créditos e licença

Dados do mapa © colaboradores do OpenStreetMap, sob a licença [ODbL](https://opendatacommons.org/licenses/odbl/). Rotas pelo BRouter. Busca pelo Photon (Komoot). Logo e identidade visual do pitch do Time 8.

Código sob licença MIT. Ver [LICENSE](LICENSE).
