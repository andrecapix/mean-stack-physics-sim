# Como Iniciar o Projeto MEAN Stack

## 🚀 Opção 1: Docker Compose (Recomendado)

⚠️ **Pré-requisito**: Docker Desktop deve estar instalado e **rodando**

```bash
# 1. Navegar para o diretório do projeto
cd 01_Fase_2_MEAN_Stack

# 2. Configurar ambiente
cp .env.example .env

# 3. Iniciar Docker Desktop (se não estiver rodando)
# Windows: Abrir Docker Desktop da bandeja do sistema
# Aguardar até aparecer "Engine running"

# 4. Subir todos os serviços
docker-compose up --build

# 5. Acessar a aplicação
# Frontend: http://localhost:4200
# API: http://localhost:3000
# Python: http://localhost:8000
```

## 🛠️ Opção 2: Desenvolvimento Local

```bash
# 1. Subir apenas banco de dados
docker-compose up -d mongo redis

# 2. Instalar dependências (em terminais separados)
cd sim-engine && pip install -r requirements.txt
cd mean-api && npm install
cd mean-ui && npm install

# 3. Rodar serviços (terminais separados)
cd sim-engine && uvicorn main:app --reload    # :8000
cd mean-api && npm run start:dev              # :3000
cd mean-ui && npm start                       # :4200
```

## ✅ Verificar se Funcionou

1. **Frontend**: http://localhost:4200 - Interface da simulação
2. **Health checks**:
   - http://localhost:3000/health - Backend
   - http://localhost:8000/health - Python Engine

## 🎯 Usar a Simulação

1. Acesse http://localhost:4200
2. Preencha os parâmetros (valores padrão já carregados)
3. Clique "Run Simulation"
4. Veja os gráficos de posição e velocidade

## 📝 Notas Importantes

- A **Opção 1 (Docker)** é mais simples e garante que tudo funcione igual ao ambiente de produção
- Se escolher desenvolvimento local, certifique-se de ter Python 3.12+ e Node.js 20+ instalados
- O MongoDB e Redis são necessários mesmo no desenvolvimento local

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Verificar processos usando portas
netstat -tulpn | grep :3000
netstat -tulpn | grep :4200
netstat -tulpn | grep :8000
```

### Docker não está rodando
```bash
# No Windows, verificar se Docker Desktop está rodando:
# 1. Procurar ícone do Docker na bandeja do sistema
# 2. Se não estiver, abrir Docker Desktop
# 3. Aguardar aparecer "Engine running"
# 4. Tentar novamente: docker-compose up --build
```

### Problemas com Docker
```bash
# Limpar containers e volumes
docker-compose down -v
docker system prune -f

# Rebuildar imagens
docker-compose build --no-cache
docker-compose up
```

### Logs dos serviços
```bash
# Ver logs de todos os serviços
docker-compose logs

# Ver logs de um serviço específico
docker-compose logs mean-api
docker-compose logs sim-engine
docker-compose logs mean-ui
```

## 🎉 Pronto!

Após seguir esses passos, você terá o sistema de simulação física rodando completo com:
- Interface web Angular
- API REST NestJS
- Microserviço Python para cálculos físicos
- Banco MongoDB
- Gráficos Chart.js funcionais