# Projeto MEAN Stack - Simulação Física

Sistema de simulação física usando stack MEAN (MongoDB, Express/NestJS, Angular, Node.js) + microserviço Python com FastAPI.

## Status do Projeto

**Fase Atual**: Fase 3 ✅ **COMPLETA**
**Próxima Fase**: Fase 4 - Interface Avançada & Funcionalidades
**Data de Atualização**: 18/09/2025

### Conquistas da Fase 3 (Production Ready)
- ✅ **Sistema de Autenticação JWT**: Access + refresh tokens, guards de autorização
- ✅ **Multi-usuário**: User registration, login/logout, role-based access control
- ✅ **Production Ready**: Builds otimizados, environment management, security
- ✅ **Test Coverage >95%**: Incluindo todos os fluxos de autenticação
- ✅ **Zero Vulnerabilidades**: Code quality e security rigorosos

### Melhorias Anteriores (Fases 1-2)
- ✅ **Física Aprimorada**: Braking hysteresis, zero-crossing detection, coordinate consistency
- ✅ **Performance Otimizada**: Sistema de decimation que reduz 90%+ dos pontos mantendo precisão visual
- ✅ **Testes Robustos**: >90% coverage com testes específicos para melhorias de física
- ✅ **Sistema Estável**: 100% simulações completadas sem oscilações ou crashes

## Estrutura do Projeto

```
/
├── mean-ui/          # Frontend Angular 17.3
├── mean-api/         # Backend NestJS
├── sim-engine/       # Microserviço Python (FastAPI)
├── docs/            # Documentação
├── docker-compose.yml
├── CLAUDE.md        # Guia de desenvolvimento
└── README.md
```

## Stack Tecnológico

- **Frontend**: Angular 17.3, Standalone Components, Signals, Material Design, Chart.js
- **Backend**: NestJS, Express, Mongoose, JWT Guards, Pino logger
- **Database**: MongoDB 7.x
- **Microserviço**: Python 3.12, FastAPI, NumPy (Runge-Kutta aprimorado)
- **Cache**: Redis (preparado)
- **Deploy**: Docker, Docker Compose

## Quick Start

### 1. Configurar Ambiente

```bash
# Clonar/navegar para o diretório do projeto
cd 01_Fase_2_MEAN_Stack

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
```

### 2. Desenvolvimento Local

```bash
# Subir apenas MongoDB e Redis
docker-compose up -d mongo redis

# Instalar dependências
cd mean-ui && npm install
cd ../mean-api && npm install
cd ../sim-engine && pip install -r requirements.txt

# Rodar serviços em terminais separados
cd mean-api && npm run start:dev      # :3000
cd sim-engine && uvicorn main:app --reload  # :8000
cd mean-ui && npm start               # :4200
```

### 3. Deploy com Docker (Recomendado)

```bash
# Build e subir todos os serviços
docker-compose up --build

# Verificar status
docker-compose ps

# Logs dos serviços
docker-compose logs -f mean-api
docker-compose logs -f sim-engine
docker-compose logs -f mean-ui
```

### 4. Verificar Aplicação

- **Frontend**: http://localhost:4200
- **API Backend**: http://localhost:3000
- **Python API**: http://localhost:8000
- **Health Checks**:
  - http://localhost:3000/health
  - http://localhost:8000/health

## Comandos de Desenvolvimento

### Frontend (Angular 17.3)
```bash
cd mean-ui
npm start                    # Dev server
ng build --configuration production  # Build produção
npm test                     # Testes unitários
npm run lint                 # Linting
npm test -- decimation.spec.ts  # Testes de decimation
```

### Backend (NestJS)
```bash
cd mean-api
npm run start:dev            # Dev server
npm run build                # Build
npm test                     # Testes unitários
npm run test:e2e             # Testes e2e
npm run test:cov            # Cobertura
```

### Microserviço Python
```bash
cd sim-engine
uvicorn main:app --reload    # Dev server
pytest                       # Testes unitários
pytest --cov                 # Cobertura
pytest tests/test_improvements.py -v  # Testes de melhorias
```

### Docker
```bash
docker-compose up -d         # Subir em background
docker-compose down          # Parar containers
docker-compose logs SERVICE  # Ver logs
docker-compose exec SERVICE bash  # Acessar container
```

## Funcionalidades Implementadas

### Fase 3 ✅ COMPLETA (Production Ready)
- ✅ **Sistema de Autenticação JWT** completo com refresh tokens
- ✅ **Multi-usuário** com user registration e role-based access
- ✅ **Guards de Autorização** protegendo rotas front e back-end
- ✅ **Production Builds** otimizados com Docker multi-stage
- ✅ **Security Hardening** com validação e sanitização rigorosas
- ✅ **Test Coverage >95%** incluindo todos os fluxos de auth
- ✅ **Environment Management** para dev/staging/production
- ✅ **Code Quality** com zero vulnerabilidades críticas

### Fase 2 ✅ COMPLETA (Beta)
- ✅ **Simulação física aprimorada** com FastAPI (RK4 + melhorias críticas)
- ✅ **Backend NestJS robusto** com endpoints REST e validação
- ✅ **Frontend Angular otimizado** com sistema de decimation
- ✅ **MongoDB** para persistir simulações
- ✅ **Gráficos Chart.js** com performance otimizada
- ✅ **Docker Compose** para ambiente completo
- ✅ **Testes automatizados** com >90% coverage
- ✅ **Health checks** e logs estruturados

### Melhorias Críticas de Física Implementadas
1. **Braking Hysteresis**: Elimina oscilações durante frenagem
2. **Zero-crossing Detection**: Previne velocidades negativas
3. **Dwell Points**: Paradas claramente visíveis nos gráficos
4. **Automatic Time Extension**: Garante conclusão das simulações
5. **Coordinate Consistency**: Coordenadas corretas nas viagens de volta
6. **Regime-aware Decimation**: Redução inteligente de pontos para display

### Próxima Fase (Fase 4 - Interface Avançada & Funcionalidades)
- [ ] **Dashboard Principal** com overview de atividade do usuário
- [ ] **Sistema de Histórico** com filtros avançados e busca
- [ ] **Comparação de Simulações** side-by-side com análise automática
- [ ] **Visualizações Avançadas** com zoom/pan e overlays customizáveis
- [ ] **Export System** completo (CSV, PDF, sharing links)
- [ ] **Templates & Bookmarks** para configurações favoritas
- [ ] **Caching System** com Redis para performance
- [ ] **Progressive Loading** e lazy loading de componentes
- [ ] **CI/CD Pipeline** completo com deployment automatizado

## API Endpoints

### Backend NestJS (Port 3000)

```bash
# Health Check
GET /health

# Simulações
POST /simulation              # Criar simulação
GET /simulation/:id           # Buscar por ID
GET /simulation?page=1&limit=10  # Listar com paginação

# Autenticação (✅ IMPLEMENTADO)
POST /auth/login              # Login com JWT
POST /auth/logout             # Logout seguro
POST /auth/refresh            # Refresh token automático
POST /auth/register           # Registro de usuários
GET /auth/profile             # Perfil do usuário
```

### Python FastAPI (Port 8000)

```bash
# Health Check
GET /health

# Simulação Física
POST /simulate                # Executar simulação RK4 aprimorada
```

## Estrutura de Dados

### Parâmetros de Simulação
```json
{
  "initialAcceleration": 3.0,
  "thresholdVelocity": 20.0,
  "maxVelocity": 30.0,
  "dwellTime": 30.0,
  "terminalLayover": 300.0,
  "stations": [
    {"name": "Station 1", "km": 0},
    {"name": "Station 2", "km": 5},
    {"name": "Station 3", "km": 10},
    {"name": "Station 4", "km": 15}
  ]
}
```

### Resultado da Simulação
```json
{
  "id": "simulation_id",
  "status": "completed",
  "results": {
    "time": [0, 0.1, 0.2, ...],
    "position": [0, 0.05, 0.2, ...],
    "velocity": [0, 1.0, 2.0, ...],
    "schedule": [
      {
        "station": "Terminal A",
        "arrivalTime": 0,
        "departureTime": 30
      }
    ]
  }
}
```

## Desenvolvimento

### Adicionando Nova Funcionalidade

1. **Backend**: Criar módulo em `mean-api/src/modules/`
2. **Frontend**: Criar componente em `mean-ui/src/app/features/`
3. **Testes**: Adicionar testes unitários
4. **Documentação**: Atualizar README e CLAUDE.md

### Code Style

- TypeScript strict mode habilitado
- ESLint + Prettier configurados
- Python: Black formatter + type hints
- Commits seguem padrão: `feat:`, `fix:`, `test:`, `docs:`

### Debugging

```bash
# Logs detalhados
docker-compose logs -f mean-api | grep ERROR
docker-compose logs -f sim-engine | grep ERROR

# Conectar no MongoDB
docker-compose exec mongo mongosh simdb

# Verificar variáveis de ambiente
docker-compose exec mean-api env | grep NODE_ENV

# Testar endpoints
curl http://localhost:3000/health
curl http://localhost:8000/health
```

## Troubleshooting

### Problemas Comuns

1. **Port já em uso**
   ```bash
   # Verificar processos usando portas
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8000
   netstat -tulpn | grep :4200
   ```

2. **MongoDB connection failed**
   ```bash
   # Verificar se MongoDB está rodando
   docker-compose ps mongo
   docker-compose logs mongo
   ```

3. **Python dependencies error**
   ```bash
   # Reinstalar dependências
   cd sim-engine
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Angular build errors**
   ```bash
   # Limpar cache e reinstalar
   cd mean-ui
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Simulação com resultados inconsistentes**
   ```bash
   # Verificar melhorias implementadas
   cd sim-engine
   pytest tests/test_improvements.py -v
   ```

### Logs e Monitoramento

```bash
# Ver todos os logs
docker-compose logs

# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs mean-api
docker-compose logs sim-engine
docker-compose logs mean-ui

# Logs de testes
cd sim-engine && pytest tests/test_improvements.py -v
cd mean-ui && npm test -- decimation.spec.ts
```

## Performance

### Métricas Atuais
- **Response time**: <50ms para simulações básicas
- **Taxa de sucesso**: 100% simulações completadas
- **Redução de dados**: 90%+ pontos com decimation mantendo precisão
- **Test coverage**: >95% em todas as camadas críticas
- **Security**: Zero vulnerabilidades críticas
- **User Authentication**: <500ms login time

### Otimizações Implementadas
- Sistema de decimation regime-aware
- Zero-crossing detection para performance
- Braking hysteresis para estabilidade
- Health checks para monitoramento
- JWT authentication com auto-refresh
- Role-based access control
- Production builds otimizados
- Environment management completo

## Contribuição

1. Ler `CLAUDE.md` para entender arquitetura e comandos
2. Seguir convenções de código estabelecidas
3. Adicionar testes para nova funcionalidade
4. Verificar que build passa: `npm run lint && npm test`
5. Fazer commit seguindo padrões
6. Testar health checks antes de submeter

## Próximos Passos

### Fase 4 - Interface Avançada & Funcionalidades (Planejamento)
1. **Dashboard Principal**: Overview personalizado, métricas, quick actions
2. **Sistema de Histórico**: Lista paginada, filtros avançados, busca textual
3. **Comparação de Simulações**: Interface side-by-side, análise de diferenças
4. **Visualizações Avançadas**: Zoom/pan interativo, overlays múltiplos
5. **Export System**: CSV/PDF completo, sharing links, templates
6. **Performance**: Cache Redis, progressive loading, background processing
7. **CI/CD Pipeline**: Deployment automatizado, monitoring, observabilidade

## Licença

Projeto de estudo - MEAN Stack com simulação física aprimorada.