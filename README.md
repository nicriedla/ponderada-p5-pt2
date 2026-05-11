# CSV Column Selector & Data Visualization
## Microinterface Interativa para Exploração de Dados

---

## 1. INTRODUÇÃO À PROPOSTA

Esta microinterface é uma solução interativa desenvolvida em **p5.js** que permite aos usuários carregar arquivos CSV, explorar sua estrutura e visualizar dados de forma intuitiva. A proposta combina **controle de dados** (seleção de colunas) com **visualização exploratória** (gráficos, tabelas, estatísticas).

### Objetivo Principal
Ajudar usuários a compreender melhor seus dados através de:
- **Importação inteligente**: carregamento de CSVs com detecção automática de tipos de dados
- **Seleção interativa**: interface visual para escolher quais colunas analisar
- **Visualizações contextuais**: gráficos adaptados ao tipo de dado (histogramas para numéricos, gráficos de barras para categóricos)
- **Exploração visual**: tabelas dinâmicas com scroll e estatísticas em tempo real

### Universo do Projeto
A interface foi pensada como um **painel de análise preliminar** — um ponto de entrada para exploração de dados que precede ferramentas mais completas. É especialmente útil para:
- Cientistas de dados / analistas que precisam validar dados rapidamente
- Usuários técnicos que querem entender a estrutura de um dataset
- Situações onde é necessário fazer uma triagem visual antes de importar em sistemas maiores

---

## 2. RASCUNHOS INICIAIS

### Conceituação
O design foi pensado em **três estados principais**:

#### **Estado 1: IDLE (Tela Inicial)**
```
┌────────────────────────────────────────┐
│  ◈ MICROINTERFACE // CSV SELECTOR ◈    │
│                                        │
│    SELECIONE COLUNAS DO CSV            │
│                                        │
│  Carregue um arquivo .csv...           │
│                                        │
│  [⬆ CARREGAR CSV]  [◎ DEMO]           │
│                                        │
└────────────────────────────────────────┘
```
- Background escuro com grid sutil
- Partículas flutuantes para dinamismo
- Dois botões: upload real ou demo dataset
- Paleta cyberpunk (ciano, roxo, verde neon)

#### **Estado 2: SELECTING (Seleção de Colunas)**
```
┌──────────────────────────────┐
│ ◈ SELEÇÃO DE COLUNAS        │
│ [✓] Coluna 1 (NUM)          │
│ [✓] Coluna 2 (CAT)          │
│ [✓] Coluna 3 (DATE)         │
│        ...                  │
│                             │
│ [ TODAS ]   [ LIMPAR ]      │
│                             │
│    [IMPORTAR + VISUALIZAR]  │
└──────────────────────────────┘
```
- Grid 3 colunas de checkboxes animados
- Indicadores de tipo de dados (NUM, CAT, DATE, BOOL) com cores
- Contagem dinâmica de seleção
- Display do nome do arquivo

#### **Estado 3: VIZ (Visualização)**
```
┌─────────────────────────────────────┐
│ ✓ N colunas importadas · M linhas   │
├─────────────────────────────────────┤
│ [VISUALIZAÇÕES]  [TABELA]           │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Histograma / Gráfico Barras │   │
│  │ com animações              │   │
│  └─────────────────────────────┘   │
│                                     │
│ [← NOVA IMPORTAÇÃO]  [‹ ›]         │
└─────────────────────────────────────┘
```
- Tabs para diferentes visualizações
- Cards estatísticos no topo
- Gráficos animados com easing
- Tabela scrollável com dados

### Paleta de Cores
```javascript
BG      = '#0e0f13'  // Fundo muito escuro (quase preto)
PANEL   = '#14161d'  // Painéis secundários
BORDER  = '#2a2d3a'  // Bordas sutis
ACCENT  = '#00e5ff'  // Ciano neon (principal)
ACCENT2 = '#7c5cff'  // Roxo neon (secundário)
SUCCESS = '#00ffb2'  // Verde neon (confirmação)
MUTED   = '#4a4f6a'  // Cinza médio (desabilitado)
TEXT    = '#c8cde8'  // Texto claro
TEXTHI  = '#ffffff'  // Texto bem claro

// Cores por tipo de dado
NUM     = '#00e5ff'  // Numérico → Ciano
CAT     = '#7c5cff'  // Categórico → Roxo
DATA    = '#ffb300'  // Data → Laranja
BOOL    = '#00ffb2'  // Booleano → Verde
```

### Interações Planejadas
1. **Upload de arquivo**: clique no botão ativa file picker do navegador
2. **Seleção de coluna**: clique no checkbox alterna estado
3. **Select All/Clear**: links no rodapé do painel
4. **Importar**: botão só ativa se houver colunas selecionadas
5. **Navegação de gráficos**: setas para navegar entre visualizações
6. **Scroll de tabela**: wheel/scroll mouse navega dados
7. **Responsividade**: canvas redimensiona com janela

---

## 3. REGISTRO DO RESULTADO OBTIDO

### Implementação Final

#### ✅ Funcionalidades Implementadas

1. **Parser CSV Inteligente**
   - Lê cabeçalhos e dados
   - Detecta tipos automaticamente via heurística
   - Suporta: Numérico, Categórico, Data (YYYY-MM-DD), Booleano

2. **Interface de Seleção**
   - Grid responsivo de 3 colunas
   - Checkboxes com animação suave
   - Indicadores visuais de tipo de dado
   - Contagem em tempo real

3. **Visualizações Adaptativas**
   - **Histograma**: para dados numéricos
     - 6 buckets automáticos
     - Linha de média (aparece com delay na animação)
     - Estatísticas: min, max, count
   - **Gráfico de Barras**: para categóricos e booleanos
     - Top 8 categorias por frequência
     - Percentuais calculados
     - Animação de crescimento
   - **Intervalo de Datas**: para colunas de data
     - Data inicial e final
     - Contagem de registros

4. **Tabela Interativa**
   - Scroll dinâmico via mouse wheel
   - Linhas alternadas para legibilidade
   - Headers com cores de tipo
   - Truncagem de texto longo

5. **Visual & Animações**
   - **Partículas flutuantes**: fundo dinâmico que remonta na tela
   - **Scan line**: efeito CRT animado
   - **Flash alpha**: transições visuais entre estados
   - **Easing cúbico**: animações suaves nos gráficos
   - **Grid de fundo**: estrutura visual sutil

#### 📊 Dados de Demo
O dataset de demonstração contém 10 funcionários com:
- ID (numérico)
- Nome (categórico)
- Idade (numérico)
- Cidade (categórico)
- Salário (numérico)
- Ativo (booleano)
- Departamento (categórico)
- Avaliação (numérico)
- Faltas (numérico)

#### 🎨 Qualidades Técnicas

**Expressão Visual em p5.js:**
- Uso avançado de canvas: múltiplas camadas de desenho
- Sistema de cores dinâmico com RGB decomposição
- Transformações geométricas para posicionamento
- Detecção de hit-box para interatividade precisa

**Responsividade:**
- Canvas redimensiona em tempo real
- Layout adaptável a qualquer resolução
- Partículas regeneradas no resize
- Checkboxes realinhados no resize

**Legibilidade Comunicacional:**
- Linguagem simples em português
- Indicadores visuais claros (cores, ícones, contadores)
- Feedback imediato em cada ação
- Estados claramente diferenciados

**Criatividade & Impacto:**
- Estética cyberpunk coerente
- Efeitos visuais motivados (não gratuitos)
- Transições suaves e fluidas
- Dataset demo com nomes brasileiros (contexto realista)

#### 📁 Estrutura de Arquivos
```
ponderada-p5-pt2/
├── index.html          # Página HTML (referencia sketch.js)
├── sketch.js           # Código p5.js separado (~650 linhas)
├── README.md           # Esta documentação
└── .git/               # Versionamento Git
```

#### 🚀 Como Usar

1. **Abrir no navegador**
   ```
   Abra index.html no navegador (Chrome, Firefox, Safari)
   ou use a extensão Live Server do VS Code
   ```

2. **Carregar um CSV**
   - Clique em "⬆ CARREGAR CSV"
   - Selecione arquivo (formato: cabeçalhos, dados separados por vírgula)
   - Escolha quais colunas analisar

3. **Testar com Demo**
   - Clique em "◎ DEMO"
   - Dataset de funcionários já carregado

4. **Explorar Dados**
   - Tab VISUALIZAÇÕES: gráficos animados
   - Tab TABELA: dados completos com scroll
   - Use setas (‹ ›) para navegar entre gráficos

#### ⚡ Requisitos
- Navegador moderno com suporte a Canvas
- p5.js v1.9.0 (CDN)
- Arquivo CSV bem formatado (UTF-8, com cabeçalhos)

#### 🎓 Coerência com Universo do Projeto

A solução alinha-se com o primeiro ponderada (p5.js geometria) na:
- **Qualidade técnica de implementação**: código bem estruturado e documentado
- **Uso expressivo do p5.js**: não apenas desenhar, mas criar experiência
- **Interatividade significativa**: cada clique tem propósito
- **Estética consistente**: paleta coerente e design intencionado

Diferencia-se por focar em **utilidade e compreensão** ao invés de replicação artística, mantendo o mesmo rigor técnico e criatividade.

---

## Autor
Desenvolvido como atividade ponderada de p5.js  
**Prazo**: 16h  
**Data**: Maio de 2026