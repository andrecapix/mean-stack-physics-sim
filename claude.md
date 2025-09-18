# Projeto MEAN Stack - Simulação Física

Guia central para desenvolvimento do sistema de simulação física usando stack MEAN + microserviço Python.

## Status Atual: Fase 3 ✅ COMPLETA

**Data de Conclusão**: 18/09/2025
**Próxima Fase**: Fase 4 - Interface Avançada & Funcionalidades

### Conquistas da Fase 3 (Production Ready)
- ✅ **Sistema de Autenticação JWT**: Access + refresh tokens com auto-refresh
- ✅ **Multi-usuário**: User registration, login/logout, role-based access control
- ✅ **Guards de Autorização**: Proteção completa de rotas front e back-end
- ✅ **Production Ready**: Builds otimizados, environment management, security
- ✅ **Test Coverage >95%**: Incluindo todos os fluxos de autenticação
- ✅ **Zero Vulnerabilidades**: Code quality e security rigorosos
- ✅ **Performance Mantida**: <50ms response time com segurança

### Conquistas Anteriores (Fases 1-2)
- ✅ **Arquitetura MEAN completa**: Angular 17.3 + NestJS + MongoDB + FastAPI Python
- ✅ **Física aprimorada**: Algoritmo RK4 com melhorias críticas implementadas
- ✅ **Frontend otimizado**: Angular com Material Design e decimation system
- ✅ **Backend robusto**: NestJS com Mongoose, validation e health checks
- ✅ **Performance**: Sistema de decimation reduz 90%+ dos pontos mantendo precisão
- ✅ **Testes robustos**: >90% coverage nas camadas críticas
- ✅ **Containerização**: Docker Compose com 5 serviços funcionais

### Objetivos da Fase 4 (Interface Avançada & Funcionalidades)
- 🎯 **Dashboard Principal**: Overview personalizado com métricas e quick actions
- 🎯 **Sistema de Histórico**: Lista paginada com filtros avançados e busca
- 🎯 **Comparação de Simulações**: Interface side-by-side com análise automática
- 🎯 **Visualizações Avançadas**: Zoom/pan interativo, overlays customizáveis
- 🎯 **Export System**: CSV/PDF completo, sharing links, templates
- 🎯 **Caching System**: Redis para performance, prefetching inteligente
- 🎯 **Progressive Loading**: Lazy loading, background processing
- 🎯 **CI/CD Pipeline**: Deployment automatizado, monitoring completo

## Bash Commands

```bash
# Frontend (Angular 17.3)
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
cd sim-engine && pytest                   # Testes unitários
cd sim-engine && pytest tests/test_improvements.py -v  # Testes específicos

# Infraestrutura
docker-compose up -d                      # MongoDB + Redis
docker-compose down                       # Parar containers
docker-compose logs -f mean-api           # Logs do backend
docker-compose logs -f sim-engine         # Logs do Python
```

## Arquitetura de Solução

### Stack Tecnológico Atual
- **Frontend**: Angular 17.3, Standalone Components, Signals, SCSS, Angular Material, Chart.js
- **Backend**: NestJS, Express, Mongoose, JWT Guards, Pino logger, Jest
- **Database**: MongoDB 7.x
- **Microserviço**: Python 3.12, FastAPI, NumPy, Pytest
- **Deploy**: Docker, Docker Compose

### Melhorias Implementadas na Fase 2
1. **Braking Hysteresis**: Elimina oscilações durante frenagem (sim-engine/engine/rk4.py:45-52)
2. **Zero-crossing Detection**: Previne velocidades negativas (sim-engine/engine/rk4.py:87-95)
3. **Dwell Points**: Paradas visíveis nos gráficos (sim-engine/engine/service.py:200-220)
4. **Automatic Time Extension**: Garante conclusão das simulações (sim-engine/engine/service.py:120-140)
5. **Coordinate Consistency**: Coordenadas corretas nas viagens de volta (sim-engine/engine/service.py:280-295)
6. **Regime-aware Decimation**: Redução inteligente de pontos para display otimizado

### Fluxo Principal
1. Angular envia parâmetros da simulação para NestJS
2. NestJS valida, autentica e salva no MongoDB
3. NestJS chama microserviço Python (FastAPI) para simulação RK4
4. Python retorna resultados otimizados (posição/tempo/velocidade)
5. NestJS armazena resultados e devolve para Angular
6. Angular aplica decimation e exibe gráficos (Chart.js)

### Estrutura de Pastas

```
/mean-ui/
  /src/app/core/         # Serviços globais (auth, http interceptors)
  /src/app/shared/       # Componentes reutilizáveis (cards, botões)
  /src/app/features/     # Telas e funcionalidades (simulation, reports)
  /src/app/display/      # Sistema de decimation e otimização
  /src/environments/     # Configurações de ambiente

/mean-api/
  /src/modules/          # Módulos NestJS (auth, simulation, users)
  /src/common/           # Filtros, pipes, interceptors
  /src/config/           # Configuração env e logger
  /src/database/         # Schemas MongoDB

/sim-engine/
  /engine/rk4.py         # Implementação Runge-Kutta aprimorada
  /engine/service.py     # Lógica de orquestração
  /tests/                # Testes pytest (>90% coverage)
  /main.py              # FastAPI app
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
- Testes específicos para melhorias de física
- Supertest para testes de API

### Convenções de Commit
```bash
feat: add user authentication
fix: resolve physics oscillation issue
test: add decimation system tests
docs: update API documentation
```

## API & Contratos

### Backend NestJS Endpoints

```typescript
# Autenticação (✅ IMPLEMENTADO)
POST /auth/login
  Body: { email: string, password: string }
  Response: { accessToken: string, user: UserDto }

POST /auth/register
  Body: { email: string, password: string, name: string }
  Response: { accessToken: string, user: UserDto }

POST /auth/refresh
  Cookie: refreshToken
  Response: { accessToken: string }

POST /auth/logout
  Response: { success: boolean }

GET /auth/profile
  Headers: Authorization: Bearer <token>
  Response: { user: UserDto }

# Simulações
POST /simulation
  Body: SimulationParamsDto
  Response: { id: string, status: 'processing' }

GET /simulation/:id
  Response: SimulationResultDto

GET /simulation
  Query: { page: number, limit: number }
  Response: PaginatedSimulationsDto

# Health Checks
GET /health
  Response: { status: 'ok', timestamp: string }
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

GET /health
  Response: { "status": "healthy" }
```

## Estratégia de Testes

### Angular (mean-ui)
```bash
# Unitários
npm test                    # Jest + Angular Testing Library
npm run test:watch         # Watch mode
npm run test:coverage      # Relatório de cobertura

# Testes de decimation
npm test -- decimation.spec.ts
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

# Melhorias específicas
pytest tests/test_improvements.py -v
pytest tests/test_improvements.py::TestReturnCoordinateConsistency -v
```

## Build, Deploy & Ambientes

### Desenvolvimento Local
```bash
# 1. Subir MongoDB + Redis
docker-compose up -d mongo redis

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

### Verificação de Status
```bash
# Health checks
curl http://localhost:3000/health     # NestJS
curl http://localhost:8000/health     # Python
curl http://localhost:4200           # Angular

# Verificar containers
docker-compose ps
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

## Observabilidade

### Logs Estruturados (Pino)
```typescript
# Log levels: error, warn, info, debug
logger.info('Simulation started', { userId, simulationId });
logger.error('Physics calculation failed', { error, params });
```

### Métricas de Performance
- Response time por endpoint: <100ms para simulações básicas
- Taxa de sucesso: 100% simulações completadas
- Redução de dados: 90%+ com decimation mantendo precisão
- Uso de CPU/memória via Docker stats

## Gestão de Riscos

### Riscos Técnicos
1. **Performance com datasets grandes**:
   - *Mitigação*: Sistema de decimation implementado
2. **Complexidade da física**:
   - *Mitigação*: Testes robustos e melhorias validadas
3. **Dependências**:
   - *Mitigação*: Docker Compose para ambiente consistente

### Riscos de Negócio
1. **Prazos da Fase 3**:
   - *Mitigação*: Arquitetura já preparada para autenticação

## Roadmap Fase 4

### Semanas 1-2: Dashboard & Interface Foundation
- [ ] Dashboard principal com overview de atividade
- [ ] Sistema de histórico com paginação
- [ ] Filtros avançados e busca textual
- [ ] Interface responsiva Material Design

### Semanas 3-4: Visualizações & Export System
- [ ] Gráficos avançados com zoom/pan
- [ ] Sistema de comparação side-by-side
- [ ] Export CSV/PDF completo
- [ ] Templates e bookmarks de configurações

### Semanas 5-6: Performance & Caching
- [ ] Sistema de cache Redis implementado
- [ ] Background processing de simulações
- [ ] Progressive loading e lazy loading
- [ ] Otimização de queries MongoDB

### Semanas 7-8: CI/CD & Advanced Features
- [ ] Pipeline CI/CD completo
- [ ] Deploy multi-ambiente automatizado
- [ ] Real-time updates via WebSocket
- [ ] Monitoring e observabilidade completos

## Checklist de Readiness

### Fase 3 ✅ COMPLETA
- ✅ Sistema de autenticação JWT completo implementado
- ✅ Multi-usuário com registration e role-based access
- ✅ Guards protegendo todas as rotas sensíveis
- ✅ Production builds otimizados com Docker
- ✅ Test coverage >95% incluindo auth flows
- ✅ Zero vulnerabilidades críticas
- ✅ Environment management completo

### Fase 2 ✅ COMPLETA
- ✅ Python FastAPI com melhorias críticas implementadas
- ✅ NestJS com guards e estrutura de auth preparada
- ✅ Angular with decimation system otimizado
- ✅ Docker Compose funcional
- ✅ Testes >90% coverage
- ✅ Performance otimizada

### Fase 4 - EM PLANEJAMENTO
- [ ] Dashboard principal com overview personalizado
- [ ] Sistema de histórico com filtros avançados
- [ ] Comparação de simulações side-by-side
- [ ] Visualizações avançadas com zoom/pan
- [ ] Export system completo (CSV/PDF/sharing)
- [ ] Caching system com Redis
- [ ] Progressive loading e lazy loading
- [ ] CI/CD pipeline com deployment automatizado

## Unexpected Project Behaviors

### Simulações Física
- **Problema**: Velocidade negativa por overshooting
- **Localização**: sim-engine/engine/rk4.py:87-95
- **Solução**: Zero-crossing detection implementado

- **Problema**: Oscilações durante frenagem
- **Localização**: sim-engine/engine/rk4.py:45-52
- **Solução**: Braking hysteresis implementado

### Performance
- **Problema**: Muitos pontos nos gráficos (lag)
- **Localização**: mean-ui/src/app/display/
- **Solução**: Regime-aware decimation implementado

### Desenvolvimento
- **Importante**: Sempre rodar health checks antes de testar
- **Importante**: Verificar logs do sim-engine para debug de física
- **Importante**: Usar pytest -v para outputs detalhados dos testes