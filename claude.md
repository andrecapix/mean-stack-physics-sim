# Projeto MEAN Stack - Simulação Física

Guia central para desenvolvimento do sistema de simulação física usando stack MEAN + microserviço Python.

## Status Atual: Fase 4 ✅ COMPLETA

**Data de Conclusão**: 18/09/2025
**Próxima Fase**: Fase 5 - Sistema Avançado de Análise & Comparação

### Conquistas da Fase 4 (Interface Avançada)
- ✅ **Dashboard Principal**: Overview personalizado com métricas em tempo real
- ✅ **Sistema de Histórico**: Lista paginada com filtros avançados e busca textual
- ✅ **Interface Responsiva**: Design adaptativo para mobile/tablet/desktop
- ✅ **Error Handling Robusto**: Estados de erro com retry e recovery automático
- ✅ **Accessibility Completo**: ARIA labels, keyboard navigation, screen reader support
- ✅ **Test Coverage >95%**: Testes unitários e integração para novos componentes
- ✅ **Performance Otimizada**: Lazy loading, progressive enhancement

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

### Objetivos da Fase 5 (Sistema Avançado de Análise)
- 🎯 **Comparação de Simulações**: Interface side-by-side com análise automática
- 🎯 **Visualizações Avançadas**: Zoom/pan interativo, overlays customizáveis
- 🎯 **Analytics Dashboard**: Métricas de sistema e insights para administradores
- 🎯 **Export System Avançado**: CSV/PDF/Excel com templates personalizáveis
- 🎯 **Caching System**: Redis para performance, prefetching inteligente
- 🎯 **Background Processing**: Simulações assíncronas e filas de processamento
- 🎯 **WebSocket Integration**: Updates em tempo real e notificações
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

### Estrutura de Pastas (Atualizada - Fase 4)

```
/mean-ui/
  /src/app/core/         # Serviços globais (auth, http interceptors)
  /src/app/shared/       # Componentes reutilizáveis (cards, botões)
  /src/app/features/     # Telas e funcionalidades principais
    /dashboard/          # ✅ Dashboard principal (Fase 4)
    /simulation/         # Simulação e configuração
      /history/          # ✅ Histórico com filtros (Fase 4)
    /auth/              # Autenticação (login, register)
    /admin/             # Funcionalidades administrativas
  /src/app/display/      # Sistema de decimation e otimização
  /src/environments/     # Configurações de ambiente

/mean-api/
  /src/modules/          # Módulos NestJS organizados
    /auth/              # Autenticação JWT
    /simulation/        # CRUD de simulações
    /users/             # Gerenciamento de usuários
  /src/common/           # Filtros, pipes, interceptors
  /src/config/           # Configuração env e logger
  /src/database/         # Schemas MongoDB

/sim-engine/
  /engine/rk4.py         # Implementação Runge-Kutta aprimorada
  /engine/service.py     # Lógica de orquestração
  /tests/                # Testes pytest (>95% coverage)
  /main.py              # FastAPI app com health checks
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

## Roadmap Fase 5 (Sistema Avançado de Análise)

### Semanas 1-2: Comparação & Analytics Foundation
- [ ] Interface de comparação side-by-side de simulações
- [ ] Sistema de análise automática de diferenças
- [ ] Dashboard de analytics para administradores
- [ ] Métricas avançadas de performance do sistema

### Semanas 3-4: Visualizações Interativas & Export Avançado
- [ ] Gráficos Chart.js com zoom/pan interativo
- [ ] Overlays customizáveis e tooltips avançados
- [ ] Export system para PDF/Excel com templates
- [ ] Sharing links e bookmarks de configurações

### Semanas 5-6: Performance & Caching System
- [ ] Implementação completa do Redis para cache
- [ ] Background processing com filas de simulação
- [ ] Progressive loading e prefetching inteligente
- [ ] Otimização de queries MongoDB com indexing

### Semanas 7-8: Real-time & CI/CD
- [ ] WebSocket integration para updates em tempo real
- [ ] Sistema de notificações push
- [ ] Pipeline CI/CD completo com testes automatizados
- [ ] Monitoring e observabilidade com métricas customizadas

## Checklist de Readiness

### Fase 4 ✅ COMPLETA
- ✅ Dashboard principal com overview personalizado e métricas
- ✅ Sistema de histórico com filtros avançados e busca
- ✅ Interface responsiva para mobile/tablet/desktop
- ✅ Error handling robusto com retry e recovery
- ✅ Accessibility completo (ARIA, keyboard nav, screen reader)
- ✅ Test coverage >95% para novos componentes
- ✅ Performance otimizada com lazy loading
- ✅ Production builds funcionando corretamente

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

### Fase 5 - EM PLANEJAMENTO
- [ ] Comparação de simulações side-by-side
- [ ] Analytics dashboard para administradores
- [ ] Visualizações avançadas com zoom/pan interativo
- [ ] Export system avançado (CSV/PDF/Excel)
- [ ] Caching system com Redis implementado
- [ ] Background processing e filas de processamento
- [ ] WebSocket integration para updates em tempo real
- [ ] CI/CD pipeline com deployment automatizado

## Componentes Implementados (Fase 4)

### Dashboard Component (mean-ui/src/app/features/dashboard/dashboard.component.ts)
**Funcionalidade**: Interface principal com overview personalizado e métricas em tempo real
**Features**:
- Métricas de atividade recente e performance do sistema
- Quick actions para navegação rápida
- Informações do usuário com role-based content
- Estados de loading e error com retry automático
- Interface responsiva para todos os dispositivos

**Localização**: mean-ui/src/app/features/dashboard/dashboard.component.ts:91-951
**Testes**: mean-ui/src/app/features/dashboard/dashboard.component.spec.ts

### History Component (mean-ui/src/app/features/simulation/history/history.component.ts)
**Funcionalidade**: Sistema avançado de histórico com filtros e busca
**Features**:
- Lista paginada de todas as simulações
- Filtros por status, data e busca textual
- Ordenação e navegação intuitiva
- Estados de loading e error handling
- Accessibility completo com ARIA labels

**Localização**: mean-ui/src/app/features/simulation/history/history.component.ts:1-700+
**Testes**: mean-ui/src/app/features/simulation/history/history.component.spec.ts

### Rotas Implementadas (mean-ui/src/app/app.routes.ts)
```typescript
// Novas rotas da Fase 4
{ path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }
{ path: 'simulation/history', component: HistoryComponent, canActivate: [AuthGuard] }
```

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

## Status do Sistema (Atual)

### Serviços Ativos
- ✅ **Backend NestJS**: http://localhost:3000 (Health: /health)
- ✅ **Python Engine**: http://localhost:8000 (Health: /health)
- ✅ **Frontend Angular**: http://localhost:4200
- ✅ **MongoDB**: Rodando via Docker Compose
- ✅ **Redis**: Preparado para Fase 5 (cache system)

### Performance Atual
- **Build Time**: ~8s (Angular production)
- **Bundle Size**: 623KB inicial, lazy chunks 90-310KB
- **Test Coverage**: >95% em todos os componentes críticos
- **Response Time**: <50ms para operações básicas
- **Error Rate**: 0% em condições normais de operação

### Próximas Melhorias (Fase 5)
1. **Redis Cache Implementation**: Reduzir latência de consultas em 80%
2. **Background Processing**: Simulações assíncronas para datasets grandes
3. **WebSocket Integration**: Updates em tempo real sem refresh
4. **Advanced Analytics**: Dashboard com insights de negócio
5. **CI/CD Pipeline**: Deploy automatizado com zero downtime

## Guia de Contribuição

### Para desenvolvedores novos no projeto:
1. **Primeiro**: Ler este CLAUDE.md completamente
2. **Setup**: Seguir instruções em "Desenvolvimento Local"
3. **Testes**: Executar `npm test` em cada módulo antes de contribuir
4. **Commits**: Seguir convenções de commit especificadas
5. **Code Review**: Todos os PRs requerem review e testes passando