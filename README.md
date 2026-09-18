# BUILD FORGE

### PC BUILDER 3D

**Monte. Personalize. Visualize.**

Monte seu PC peça por peça, valide a compatibilidade e visualize sua configuração em 3D.

---

## Features

**Montagem**

- Catálogo com 9 categorias: CPU, GPU, placa-mãe, RAM, armazenamento, fonte, gabinete, cooler e ventoinhas.
- Adicionar, remover e substituir componentes; quantidade configurável para ventoinhas.
- Busca por texto (nome, marca e especificações) com filtros de marca e preço, além de ordenação.
- Cálculo automático do total, atualizado a cada alteração.

**Compatibilidade**

Motor de regras puro (`lib/compatibility.ts`) com status 🟢 compatível / 🟡 atenção / 🔴 incompatível.
Cada alerta abre explicando o motivo e quais componentes estão envolvidos.

| Verificação | Regra |
| --- | --- |
| CPU × Placa-mãe | Socket idêntico |
| RAM × Placa-mãe | Tipo DDR, nº de módulos vs. slots, capacidade e frequência máximas |
| RAM × CPU | Tipo suportado e frequência validada pelo controlador |
| GPU × Gabinete | Comprimento da placa vs. limite do gabinete (com aviso de folga apertada) |
| Placa-mãe × Gabinete | Form factor suportado |
| Cooler × CPU | Socket suportado e TDP dissipado |
| Cooler × Gabinete | Altura (ar) ou tamanho do radiador (water) |
| Cooler × RAM | Folga de altura para os módulos |
| Storage × Placa-mãe | Slot M.2 ou porta SATA disponível |
| Fonte | Consumo estimado vs. potência, conectores PCIe e comprimento |
| Ventoinhas | Posições no gabinete e headers na placa-mãe |
| Saída de vídeo | CPU sem vídeo integrado e sem GPU dedicada |

**Visualização 3D**

- Cena construída com Three.js / React Three Fiber / Drei — `OrbitControls`, `PerspectiveCamera` e `Environment`.
- Girar, aproximar, afastar e reenquadrar a câmera; rotação automática opcional.
- Clique em qualquer peça para destacá-la (borda + etiqueta) e abrir o painel de detalhes.
- Ocultar/mostrar componentes individualmente.
- **X-RAY** — deixa o chassi translúcido.
- **EXPLODED VIEW** — afasta cada grupo com animação suave.
- Gabinete aberto (sem lateral) ou fechado (vidro temperado).
- Cabos simplificados PSU → placa-mãe / GPU / storage.
- **RGB** — liga/desliga, cor, intensidade e efeitos `static`, `breathing`, `rainbow` e `pulse`, aplicados em RAM, ventoinhas, GPU, cooler e gabinete.

**Análises**

- Consumo estimado por componente, com margem de segurança configurável (20%, 30%, 40% ou 50%) e fonte recomendada.
- Índices estimados de Gaming / Productivity / Rendering.
- Temperaturas aproximadas de CPU e GPU (idle e em jogo) e índice de refrigeração.

**Builds**

- Salvar, renomear, duplicar e excluir builds (localStorage).
- Compartilhar via URL `/build/<code>`: a configuração inteira é codificada no próprio link, então funciona em qualquer dispositivo sem backend.
- Exportar em **PDF** (via impressão do navegador), **JSON** ou copiar a configuração como texto.
- Comparar duas builds lado a lado — as diferenças são mostradas de forma objetiva, sem eleger uma "vencedora".

> ⚠️ **Dados mock.** Preços, índices de desempenho e temperaturas vêm de um catálogo de demonstração em `data/components.ts`. Não são valores reais de mercado e nenhuma API externa é consultada.

---

## Tech Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| 3D | Three.js, React Three Fiber, `@react-three/drei` |
| Estado | Zustand (com `persist`) |
| Ícones | lucide-react |
| Lint | ESLint + `eslint-config-next` |

Sem dependências de serviços externos: o projeto sobe apenas com `npm install && npm run dev`.

---

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Abra <http://localhost:3000>.

## Build

```bash
npm run build
npm start
```

## Lint

```bash
npm run lint
```

---

## Architecture

```text
forge-pc/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── builder/page.tsx      # Builder (catálogo | 3D | summary)
│   ├── builds/page.tsx       # Builds salvas
│   ├── compare/page.tsx      # Comparador
│   ├── build/[code]/page.tsx # Build compartilhada
│   ├── error.tsx             # Fallback de erro de rota
│   ├── loading.tsx           # Skeleton de rota
│   ├── not-found.tsx
│   └── globals.css           # Design tokens (@theme) e utilitários
│
├── components/
│   ├── builder/              # Header, catálogo, summary, painéis, dock, modais
│   ├── three/                # Cena e modelos 3D (um arquivo por peça)
│   ├── ui/                   # Button, Panel, Modal, Status, Toast, ErrorBoundary…
│   ├── dashboard/            # Hero e cards de builds prontas
│   ├── builds/               # Gestão e visualização de builds
│   └── comparison/           # Comparador
│
├── data/
│   ├── components.ts         # Catálogo MOCK
│   └── builds.ts             # Builds iniciais
│
├── lib/
│   ├── compatibility.ts      # Motor de regras
│   ├── calculations.ts       # Preço, consumo, desempenho, temperatura
│   ├── three-layout.ts       # Posicionamento 3D (1 unidade = 100 mm)
│   ├── storage.ts            # BuildRepository (localStorage)
│   ├── share.ts              # Codificação/decodificação de links
│   ├── export.ts             # JSON, PDF e clipboard
│   ├── build-utils.ts        # Conversões seleção ⇄ ids
│   └── format.ts             # Formatação de preço e especificações
│
├── store/
│   ├── build-store.ts        # Build em edição (persistida)
│   ├── builds-store.ts       # Coleção de builds salvas
│   └── viewer-store.ts       # Estado do visualizador 3D
│
├── types/
│   ├── components.ts         # Modelo de domínio das peças
│   └── build.ts              # Build, compatibilidade, estimativas
│
└── public/models/            # Espaço para modelos GLB/GLTF reais
```

### Decisões de projeto

- **Separação estrita.** UI, lógica, dados, estado, 3D, compatibilidade e cálculos vivem em camadas distintas. O motor de compatibilidade e os estimadores são funções puras de `BuildSelection` e podem ser testados sem renderizador.
- **Sem `any`.** As especificações são uniões discriminadas por categoria (`CpuComponent`, `GpuComponent`, …), então as regras acessam campos tipados.
- **Persistência plugável.** `lib/storage.ts` expõe a interface `BuildRepository`; trocar `localBuildRepository` por um cliente HTTP move tudo para um banco sem tocar nos componentes.
- **Só ids são persistidos.** A store salva `BuildComponentIds`, não objetos inteiros — payloads pequenos e catálogo livre para evoluir. Ids desconhecidos são descartados na leitura.
- **3D com fallback garantido.** Nenhum modelo externo é necessário: todas as peças são construídas com primitivas do Three.js a partir das medidas reais da ficha técnica (o gabinete usa `widthMm/heightMm/depthMm`, a GPU usa `lengthMm`, e assim por diante). `model3D` já existe no tipo para quando houver GLB/GLTF.
- **Sem downloads em runtime.** O `Environment` é gerado proceduralmente com `Lightformer`, evitando o HDRI remoto do Drei — a cena funciona offline.
- **Erros isolados.** O canvas fica dentro de um `ErrorBoundary` + `Suspense`: falha de WebGL degrada para uma mensagem e o resto do builder continua funcionando. Todo acesso a `localStorage` é protegido por `try/catch`.

---

## Future Improvements

O projeto foi estruturado para receber, sem reescrita:

- PostgreSQL + Prisma no lugar do `localStorage` (via `BuildRepository`).
- Autenticação e contas de usuário; builds por usuário.
- API de componentes com preços reais, integração com lojas e comparação de preços.
- Códigos de compartilhamento curtos servidos pelo backend (a rota `/build/[code]` já aceita id e payload codificado).
- Modelos 3D reais em GLB/GLTF e upload de modelos (`model3D` já faz parte do tipo).
- Favoritos, ranking de builds, histórico e compartilhamento público.
- Sugestão de configurações por IA a partir de orçamento e objetivo de uso.
- Telemetria térmica e benchmarks reais no lugar das estimativas mock.
