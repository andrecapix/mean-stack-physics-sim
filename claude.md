# Projeto MEAN Stack - Simulação Física

Guia central para desenvolvimento do sistema de simulação física usando stack MEAN + microserviço Python.

## Bash Commands

```bash
# Frontend (Angular 20)
cd mean-ui && npm start                    # Dev server
cd mean-ui && ng build --configuration production  # Build produção
cd mean-ui && npm test                     # Testes unitários
cd mean-ui && npm run lint                 # Linting

# Backend (NestJS)
cd mean-api && npm run start:dev          # Dev server
cd mean-api && npm run build              # Build
cd mean-api && npm test                   # Testes unitários
cd mean-api && npm run test:e2e           # Testes e2e

# Microserviço Python
cd sim-engine && uvicorn main:app --reload  # Dev server
cd sim-engine && pytest                   # Testes

# Infraestrutura
docker-compose up -d                      # MongoDB + Redis
docker-compose down                       # Parar containers
```

## Visão & Objetivos

### OKRs Mensuráveis
- **O1**: Migrar simulação JS para arquitetura MEAN stack
  - KR1: 100% funcionalidades do esboço JS reproduzidas
  - KR2: API REST com <200ms response time
  - KR3: Interface Angular com Material Design responsiva

- **O2**: Implementar sistema de autenticação robusto
  - KR1: JWT + refresh tokens funcionando
  - KR2: RBAC com roles básicos (user, admin)
  - KR3: Zero vazamentos de lógica proprietária no frontend

- **O3**: Garantir qualidade e observabilidade
  - KR1: >90% cobertura de testes
  - KR2: Pipeline CI/CD automatizado
  - KR3: Logs estruturados com Pino

### MVP Definition
Sistema funcional que reproduz todas as capacidades do esboço JavaScript original com arquitetura MEAN stack.

## Escopo & Não-Escopo

### Fase 1 - MVP (4-6 semanas)
**Escopo:**
- Core da simulação física migrado para FastAPI
- UI Angular básica (1 tela principal)
- Backend NestJS com endpoints essenciais
- MongoDB para persistir simulações
- Gráficos Chart.js funcionando

**Não-escopo:**
- Sistema de autenticação
- Múltiplos usuários
- Interface complexa

### Fase 2 - Beta (3-4 semanas)
**Escopo:**
- Sistema de autenticação JWT completo
- UI Angular completa com Material Design
- Múltiplos gráficos e exportação CSV
- Testes automatizados configurados

**Não-escopo:**
- Performance otimizada
- Monitoramento avançado

### Fase 3 - GA (2-3 semanas)
**Escopo:**
- Performance otimizada
- Observabilidade completa
- CI/CD pipeline
- Documentação final

## Arquitetura de Solução

### Stack Tecnológico
- **Frontend**: Angular 20, Standalone Components, Signals, SCSS, Angular Material, Chart.js
- **Backend**: NestJS, Express, Mongoose, JWT, Pino logger, Jest
- **Database**: MongoDB 7.x
- **Microserviço**: Python 3.12, FastAPI, NumPy
- **Tests**: Jest (Angular + NestJS), Pytest (Python)
- **Deploy**: Docker, Docker Compose

### Fluxo Principal
1. Angular envia parâmetros da simulação para NestJS
2. NestJS valida, autentica e salva no MongoDB
3. NestJS chama microserviço Python (FastAPI) para simulação RK4
4. Python retorna resultados (posição/tempo/velocidade)
5. NestJS armazena resultados e devolve para Angular
6. Angular exibe gráficos (Chart.js)

### Estrutura de Pastas

```
/mean-ui/
  /src/app/core/         # Serviços globais (auth, http interceptors)
  /src/app/shared/       # Componentes reutilizáveis (cards, botões)
  /src/app/features/     # Telas e funcionalidades (simulation, reports)
  /src/environments/     # Configurações de ambiente

/mean-api/
  /src/modules/          # Módulos NestJS (auth, simulation, users)
  /src/common/           # Filtros, pipes, interceptors
  /src/config/           # Configuração env e logger
  /src/database/         # Schemas MongoDB

/sim-engine/
  /engine/rk4.py         # Implementação Runge-Kutta
  /engine/service.py     # Lógica de orquestração
  /tests/                # Testes pytest
  /main.py              # FastAPI app

/docs/                  # Documentação adicional
```

## Code Style & Quality

### TypeScript (Angular + NestJS)
- TypeScript strict mode habilitado
- ESLint + Prettier configurados
- Imports organizados (core, shared, features)
- Interfaces explícitas para todos os DTOs
- Standalone components no Angular
- Signals para estado reativo

### Python (FastAPI)
- Python 3.12 com type hints
- Black formatter + isort
- Pydantic models para validação
- Async/await para operações I/O

### Testes
- Jest para Angular/NestJS (>90% coverage)
- Pytest para Python (>90% coverage)
- Mocks com jest-mock-extended
- Supertest para testes de API

### Convenções de Commit
```bash
feat: add user authentication
fix: resolve chart rendering issue
test: add simulation engine tests
docs: update API documentation
```

## Segurança & Autenticação

### Autenticação
- **JWT curto** (15min) + **refresh token** (7d, httpOnly cookie)
- Refresh automático no frontend
- Logout limpa todos os tokens

### Autorização
- RBAC baseado em roles/permissions
- Guards nos endpoints NestJS
- Guards nas rotas Angular

### Proteção da Lógica Proprietária
- Frontend nunca acessa lógica de simulação diretamente
- Toda física roda no microserviço Python
- Autenticação obrigatória para acessar sim-engine

### Configuração Segura
```env
# Backend NestJS
JWT_SECRET=strong_random_secret_here
REFRESH_SECRET=another_strong_secret
MONGO_URI=mongodb://localhost:27017/simdb

# Python Microservice
SIM_ENGINE_URL=http://localhost:8000
```

## API & Contratos

### Backend NestJS Endpoints

```typescript
# Autenticação
POST /auth/login
  Body: { email: string, password: string }
  Response: { accessToken: string, user: UserDto }

POST /auth/refresh
  Cookie: refreshToken
  Response: { accessToken: string }

POST /auth/logout
  Response: { success: boolean }

# Simulações
POST /simulation
  Body: SimulationParamsDto
  Response: { id: string, status: 'processing' }

GET /simulation/:id
  Response: SimulationResultDto

GET /simulation
  Query: { page: number, limit: number }
  Response: PaginatedSimulationsDto
```

### Python FastAPI Endpoints

```python
POST /simulate
  Body: {
    "initial_accel": float,
    "threshold_speed": float,
    "max_speed": float,
    "stations": [{"name": str, "km": float}],
    "dwell_time": float,
    "terminal_layover": float,
    "dt": float
  }
  Response: {
    "time": List[float],
    "position": List[float],
    "velocity": List[float],
    "schedule": List[StationSchedule]
  }
```

### DTOs Principais

```typescript
// Angular/NestJS
interface SimulationParamsDto {
  initialAcceleration: number;
  thresholdVelocity: number;
  maxVelocity: number;
  dwellTime: number;
  terminalLayover: number;
  stations: StationDto[];
}

interface StationDto {
  name: string;
  km: number;
}

interface SimulationResultDto {
  id: string;
  params: SimulationParamsDto;
  results: {
    time: number[];
    position: number[];
    velocity: number[];
    schedule: ScheduleEntryDto[];
  };
  createdAt: Date;
}
```

## Estratégia de Testes

### Angular (mean-ui)
```bash
# Unitários
npm test                    # Jest + Angular Testing Library
npm run test:watch         # Watch mode
npm run test:coverage      # Relatório de cobertura

# E2E
npm run e2e               # Cypress (Fase 2)
```

### NestJS (mean-api)
```bash
# Unitários
npm test                  # Jest
npm run test:watch       # Watch mode
npm run test:cov         # Cobertura

# Integração
npm run test:e2e         # Supertest
```

### Python (sim-engine)
```bash
# Unitários
pytest                   # Testes das funções RK4
pytest --cov            # Cobertura

# Integração
pytest tests/test_api.py # Testes dos endpoints FastAPI
```

## Build, Deploy & Ambientes

### Desenvolvimento Local
```bash
# 1. Subir MongoDB
docker-compose up -d mongo

# 2. Instalar dependências
cd mean-ui && npm install
cd mean-api && npm install
cd sim-engine && pip install -r requirements.txt

# 3. Configurar .env
cp .env.example .env

# 4. Rodar serviços
cd mean-api && npm run start:dev      # :3000
cd sim-engine && uvicorn main:app --reload  # :8000
cd mean-ui && npm start               # :4200
```

### Build de Produção
```bash
# Angular
ng build --configuration production

# NestJS
npm run build

# Python
docker build -t sim-engine ./sim-engine
```

### Deploy com Docker
```bash
# Build all services
docker-compose build

# Deploy
docker-compose up -d

# Verificar status
docker-compose ps
```

## Observabilidade

### Logs Estruturados (Pino)
```typescript
// NestJS logger configuration
import { Logger } from '@nestjs/common';

# Log levels: error, warn, info, debug
logger.info('Simulation started', { userId, simulationId });
logger.error('Physics calculation failed', { error, params });
```

### Métricas Básicas
- Response time por endpoint
- Taxa de erro das simulações
- Uso de CPU/memória (Docker stats)
- Conexões ativas no MongoDB

### Health Checks
```bash
GET /health          # NestJS health
GET /sim/health      # Python FastAPI health
```

## Gestão de Riscos

### Riscos Técnicos
1. **Complexidade da física**: Migração JS → Python pode introduzir bugs
   - *Mitigação*: Testes comparativos com dados do JS original

2. **Performance**: Cálculos pesados podem ser lentos
   - *Mitigação*: Profiling e otimização incremental

3. **Dependências**: Múltiplos serviços aumentam complexidade
   - *Mitigação*: Docker Compose para ambiente consistente

### Riscos de Negócio
1. **Prazos agressivos**: Arquitetura complexa vs. tempo limitado
   - *Mitigação*: Abordagem faseada com MVPs funcionais

## Roadmap Faseado

### Fase 1 - MVP (Semanas 1-6)
**Critérios de Entrada:**
- Ambiente de desenvolvimento configurado
- Estrutura de pastas criada
- Docker Compose funcionando

**Entregáveis:**
- [ ] Microserviço Python com física migrada
- [ ] Backend NestJS com endpoints básicos
- [ ] Frontend Angular com tela principal
- [ ] MongoDB persistindo simulações
- [ ] Gráficos Chart.js renderizando

**Critérios de Saída:**
- Funcionalidade completa do JS original reproduzida
- Testes básicos passando
- Deploy local funcionando

### Fase 2 - Beta (Semanas 7-10)
**Critérios de Entrada:**
- MVP validado e funcional
- Feedback inicial coletado

**Entregáveis:**
- [ ] Sistema de autenticação JWT
- [ ] Interface Material Design completa
- [ ] Múltiplos gráficos e exportação
- [ ] Suite de testes automatizados
- [ ] Documentação da API

**Critérios de Saída:**
- Sistema pronto para usuários finais
- >90% cobertura de testes
- Performance aceitável (<200ms API)

### Fase 3 - GA (Semanas 11-13)
**Critérios de Entrada:**
- Beta validada em ambiente de teste
- Performance benchmarked

**Entregáveis:**
- [ ] Pipeline CI/CD configurado
- [ ] Monitoramento e alertas
- [ ] Otimizações de performance
- [ ] Documentação completa
- [ ] Deploy produtivo

**Critérios de Saída:**
- Sistema em produção estável
- Monitoramento operacional
- Runbooks documentados

## Checklist de Readiness

### Fase 1 (MVP)
- [ ] Python FastAPI implementado e testado
- [ ] NestJS com MongoDB conectado
- [ ] Angular renderizando gráficos
- [ ] Docker Compose funcional
- [ ] Simulação completa funcionando

### Fase 2 (Beta)
- [ ] Autenticação JWT implementada
- [ ] Guards de segurança configurados
- [ ] Interface Material Design
- [ ] Testes automatizados (>80% coverage)
- [ ] Exportação CSV funcionando

### Fase 3 (GA)
- [ ] CI/CD pipeline funcional
- [ ] Logs estruturados implementados
- [ ] Health checks configurados
- [ ] Performance otimizada
- [ ] Documentação completa

## Workflow

### Development Process
1. **Antes de codificar**: Ler este claude.md
2. **Durante desenvolvimento**: Seguir code style e test coverage
3. **Após mudanças**: Rodar linting e testes
4. **Antes de commit**: Verificar se build passa
5. **Deploy**: Usar Docker Compose para consistência

### Testing Strategy
- Escrever testes antes de implementar (TDD)
- Manter >90% coverage em todas as camadas
- Rodar testes em CI/CD pipeline
- Usar mocks para dependências externas

### Error Handling
- Logs estruturados com contexto suficiente
- Fallbacks graceful para falhas de rede
- Validação rigorosa de inputs
- Error boundaries no Angular