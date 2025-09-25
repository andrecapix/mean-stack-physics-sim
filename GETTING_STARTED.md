# 🧹 Guia Completo: Reset Total do Sistema MEAN Stack

Este é um prompt interativo para executar uma limpeza completa e reinicialização do projeto MEAN Stack, garantindo que instalações anteriores não prejudiquem o funcionamento.

## 📋 Pré-requisitos

- Docker Desktop instalado
- Node.js 20+ instalado
- Python 3.12+ instalado
- VS Code com Claude Code

---

## 🚀 PROMPT INTERATIVO PARA CLAUDE CODE

```
Olá! Preciso fazer um reset completo do projeto MEAN Stack localizado em:
C:/Users/Pinheiro/Desktop/0000_Otmza_Program_Studies/01_Fase_2_MEAN_Stack

Execute os seguintes passos NA ORDEM e aguarde minha confirmação antes de prosseguir para o próximo:

PASSO 1 - PREPARAÇÃO DO AMBIENTE:
- Me instrua a fechar o Docker Desktop completamente
- Me instrua a fechar todos os navegadores (Chrome, Firefox, Edge, etc.)
- Me instrua a manter apenas este VS Code com Claude Code aberto
- Aguarde eu confirmar "Pronto para Passo 2"

PASSO 2 - LIMPEZA DO CLAUDE CODE E TERMINAL:
- Execute comando para limpar cache do Claude Code no VS Code
- Execute comando para limpar histórico do terminal atual
- Execute comando para limpar variáveis de ambiente temporárias
- Execute limpeza de cache do PowerShell/CMD se necessário
- Aguarde eu confirmar "Pronto para Passo 3"

PASSO 3 - VERIFICAÇÃO DOCKER:
- Me instrua a abrir o Docker Desktop
- Me instrua a aguardar até aparecer "Engine running"
- Execute verificação se Docker está rodando com: docker ps
- Se der erro de conexão, me instrua a aguardar mais e tentar novamente
- Aguarde eu confirmar "Docker funcionando"

PASSO 4 - LIMPEZA DOCKER COMPLETA:
- Execute: docker-compose down -v (remover containers e volumes)
- Execute: docker system prune -f (limpar build cache)
- Execute: docker volume prune -f (remover volumes órfãos)
- Execute: docker image prune -a -f (remover imagens não utilizadas)
- Mostre estatísticas de espaço liberado
- Aguarde eu confirmar "Limpeza Docker concluída"

PASSO 5 - LIMPEZA DE CACHES NPM E PYTHON:
- Execute: npm cache clean --force (cache global)
- Execute: cd mean-ui && npm cache clean --force
- Execute: cd mean-api && npm cache clean --force
- Execute: pip cache purge
- Mostre quantos arquivos foram removidos
- Aguarde eu confirmar "Caches limpos"

PASSO 6 - REMOÇÃO DE ARQUIVOS TEMPORÁRIOS:
- Execute: rm -rf mean-ui/node_modules mean-ui/dist mean-ui/.angular
- Execute: rm -rf mean-api/node_modules mean-api/dist
- Execute: find sim-engine -name "__pycache__" -type d -exec rm -rf {} +
- Execute: find . -name "*.log" -type f -delete
- Liste os diretórios removidos
- Aguarde eu confirmar "Arquivos temporários removidos"

PASSO 7 - REINSTALAÇÃO DE DEPENDÊNCIAS:
- Execute: cd mean-ui && npm install
- Execute: cd mean-api && npm install
- Execute: cd sim-engine && pip install -r requirements.txt
- Mostre resumo de packages instalados
- Aguarde eu confirmar "Dependências reinstaladas"

PASSO 8 - REBUILD DOCKER IMAGES:
- Execute: docker-compose build --no-cache
- Mostre progresso do build
- Aguarde eu confirmar "Build concluído"

PASSO 9 - INICIALIZAÇÃO DOS SERVIÇOS:
- Execute: docker-compose up -d
- Execute: sleep 30
- Execute verificação dos containers: docker-compose ps
- Aguarde eu confirmar "Serviços iniciados"

PASSO 10 - VERIFICAÇÃO FINAL:
- Execute: curl http://localhost:3000/health
- Execute: curl http://localhost:8000/health
- Execute: curl -I http://localhost:4200
- Me instrua a abrir http://localhost:4200 no navegador para verificar
- Aguarde eu confirmar "Verificação concluída"

PASSO 11 - DOCUMENTAÇÃO:
- Atualize o arquivo GETTING_STARTED.md com os passos executados
- Crie um relatório final com:
  * Tempo total gasto
  * Espaço em disco liberado
  * Status de todos os serviços
  * URLs de acesso
- Aguarde eu confirmar "Documentação atualizada"

IMPORTANTE:
- Execute APENAS UM PASSO por vez
- Aguarde SEMPRE minha confirmação antes do próximo passo
- Se algum comando falhar, pare e me informe o erro
- Mostre o output completo de cada comando executado
- Se eu disser "pular" em algum passo, prossiga para o próximo

Está pronto para começar? Digite "SIM" para iniciar o Passo 1.
```

---

## 📝 Template de Confirmações

Use estas frases exatas para confirmar cada passo:

- **Passo 1**: "Pronto para Passo 2"
- **Passo 2**: "Pronto para Passo 3"
- **Passo 3**: "Docker funcionando"
- **Passo 4**: "Limpeza Docker concluída"
- **Passo 5**: "Caches limpos"
- **Passo 6**: "Arquivos temporários removidos"
- **Passo 7**: "Dependências reinstaladas"
- **Passo 8**: "Build concluído"
- **Passo 9**: "Serviços iniciados"
- **Passo 10**: "Verificação concluída"
- **Passo 11**: "Documentação atualizada"

---

## 🔧 Comandos de Emergência

Se algum passo falhar, use estes comandos:

### Docker não responde:
```bash
# Reiniciar Docker Desktop manualmente
# Aguardar 2-3 minutos
# Tentar: docker system info
```

### Portas ocupadas:
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :4200
netstat -ano | findstr :8000

# Matar processo se necessário
taskkill /PID [numero_do_pid] /F
```

### Cache corrompido:
```bash
# Limpar TUDO do npm
npm cache clean --force
npm cache verify

# Limpar TUDO do pip
pip cache purge
pip cache info
```

---

## 📊 Checklist Final

Após completar todos os passos, verifique:

- [ ] Docker Desktop rodando
- [ ] 5 containers UP (mongo, redis, mean-api, mean-ui, sim-engine)
- [ ] http://localhost:4200 carrega a interface Angular
- [ ] http://localhost:3000/health retorna {"status":"healthy"}
- [ ] http://localhost:8000/health retorna {"status":"healthy"}
- [ ] Sem erros no console do navegador
- [ ] Documentação atualizada

---

## ⏱️ Tempo Estimado

- **Total**: 15-25 minutos
- **Limpeza**: 5 minutos
- **Reinstalação**: 5 minutos
- **Rebuild Docker**: 5-10 minutos
- **Verificação**: 5 minutos

---

## 🆘 Suporte

Se algum passo falhar:

1. **Copie a mensagem de erro completa**
2. **Informe em qual passo parou**
3. **Use o comando**: `docker-compose logs [nome-do-serviço]` para mais detalhes
4. **Reinicie do Passo 3** se necessário

---

*Este guia garante uma instalação 100% limpa, sem conflitos de versões anteriores ou caches corrompidos.*

---

## 📊 Último Reset Executado

**Data**: 25/09/2025 às 01:23:51 UTC
**Duração Total**: ~8 minutos
**Status**: ✅ **SUCESSO COMPLETO**

### Estatísticas de Limpeza
- **Docker Space Liberado**: ~1.008GB (711MB build cache + 297MB images)
- **NPM Caches**: Limpos (global + mean-ui + mean-api)
- **Python Cache**: Limpo (0 arquivos)
- **Arquivos Temporários**: node_modules, dist, .angular, __pycache__ removidos

### Build Results
- **mean-ui**: Bundle 638KB + lazy chunks, build 44s
- **mean-api**: 0 vulnerabilidades após prune, build 28s
- **sim-engine**: Python dependencies atualizadas, build 37s

### Containers Status (✅ Todos UP)
```
NAME         STATUS          PORTS
mean-mongo   Up 41 seconds   0.0.0.0:27017->27017/tcp
mean-redis   Up 41 seconds   0.0.0.0:6380->6379/tcp
mean-api     Up 41 seconds   0.0.0.0:3000->3000/tcp
sim-engine   Up 41 seconds   0.0.0.0:8000->8000/tcp
mean-ui      Up 40 seconds   0.0.0.0:4200->4200/tcp
```

### Health Checks Final
- ✅ **Backend**: http://localhost:3000/health → {"status":"healthy"}
- ✅ **Python**: http://localhost:8000/health → {"status":"healthy"}
- ✅ **Frontend**: http://localhost:4200 → HTTP 200 OK

### URLs de Acesso
- **Interface Principal**: http://localhost:4200
- **API Backend**: http://localhost:3000
- **Python Engine**: http://localhost:8000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6380

---

*Sistema 100% funcional e pronto para desenvolvimento.*