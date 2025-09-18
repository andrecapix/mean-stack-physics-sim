# Projeto MEAN Stack - Simulação Física

Sistema de simulação física usando stack MEAN (MongoDB, Express/NestJS, Angular, Node.js) + microserviço Python com FastAPI.

## Estrutura do Projeto

```
/
├── mean-ui/          # Frontend Angular 17+
├── mean-api/         # Backend NestJS
├── sim-engine/       # Microserviço Python (FastAPI)
├── docs/            # Documentação
├── docker-compose.yml
└── README.md
```

## Tecnologias

- **Frontend**: Angular 17, Standalone Components, Signals, Material Design, Chart.js
- **Backend**: NestJS, Express, Mongoose, JWT, Pino logger
- **Database**: MongoDB 7.x
- **Microserviço**: Python 3.12, FastAPI, NumPy (Runge-Kutta)
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

### 4. Acessar Aplicação

- **Frontend**: http://localhost:4200
- **API Backend**: http://localhost:3000
- **Python API**: http://localhost:8000
- **Health Checks**:
  - http://localhost:3000/health
  - http://localhost:8000/health

## Comandos Úteis

### Frontend (Angular)
```bash
cd mean-ui
npm start                    # Dev server
ng build --configuration production  # Build produção
npm test                     # Testes unitários
npm run lint                 # Linting
```

### Backend (NestJS)
```bash
cd mean-api
npm run start:dev            # Dev server
npm run build                # Build
npm test                     # Testes unitários
npm run test:e2e             # Testes e2e
```

### Microserviço Python
```bash
cd sim-engine
uvicorn main:app --reload    # Dev server
pytest                       # Testes
pytest --cov                 # Cobertura
```

### Docker
```bash
docker-compose up -d         # Subir em background
docker-compose down          # Parar containers
docker-compose logs SERVICE  # Ver logs
docker-compose exec SERVICE bash  # Acessar container
```

## Funcionalidades

### MVP (Fase 1)
- ✅ Simulação física migrada para FastAPI (Runge-Kutta)
- ✅ Backend NestJS com endpoints REST
- ✅ Frontend Angular com formulário de parâmetros
- ✅ MongoDB para persistir simulações
- ✅ Gráficos Chart.js (posição vs tempo, velocidade vs tempo)
- ✅ Docker Compose para ambiente completo

### Próximas Fases
- [ ] Sistema de autenticação JWT
- [ ] Interface Material Design completa
- [ ] Múltiplos gráficos e exportação CSV
- [ ] Testes automatizados (>90% coverage)
- [ ] Pipeline CI/CD

## API Endpoints

### Backend NestJS (Port 3000)

```bash
# Health Check
GET /health

# Simulações
POST /simulation              # Criar simulação
GET /simulation/:id           # Buscar por ID
GET /simulation?page=1&limit=10  # Listar com paginação

# Autenticação (Fase 2)
POST /auth/login              # Login
POST /auth/logout             # Logout
POST /auth/refresh            # Refresh token
```

### Python FastAPI (Port 8000)

```bash
# Health Check
GET /health

# Simulação Física
POST /simulate                # Executar simulação RK4
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
```

## Contribuição

1. Ler `CLAUDE.md` para entender arquitetura
2. Seguir convenções de código
3. Adicionar testes para nova funcionalidade
4. Verificar que build passa: `npm run lint && npm test`
5. Fazer commit seguindo padrões

## Licença

Projeto de estudo - MEAN Stack com simulação física.