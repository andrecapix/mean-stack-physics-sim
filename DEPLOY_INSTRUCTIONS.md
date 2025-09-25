# 🚀 Deploy Completo - Instruções Passo a Passo

## Status Atual: Arquivos Prontos para Deploy ✅

**Commit criado**: `56dc76a` - "feat: add Python FastAPI production deployment files"
**Arquivos prontos**: Todos os arquivos de produção foram criados e testados localmente

---

## 📋 **PASSO 1: Upload para GitHub (VOCÊ PRECISA FAZER)**

### 1.1 Criar Repositório no GitHub:
1. Acesse [github.com](https://github.com)
2. Click "New Repository"
3. Nome: `mean-stack-physics-sim` (ou nome de sua escolha)
4. ✅ Public (para Railway free tier)
5. ❌ Não adicione README, .gitignore, license (já temos local)

### 1.2 Conectar Repositório Local:
```bash
# Execute estes comandos na pasta do projeto:
cd "C:/Users/Pinheiro/Desktop/0000_Otmza_Program_Studies/02_01_Fase_3_MEAN_Stack_Deploy"

git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

**Substitua**:
- `SEU_USUARIO` = seu username GitHub
- `SEU_REPOSITORIO` = nome que você criou

---

## 📋 **PASSO 2: Deploy Python no Railway**

### 2.1 Criar Conta Railway:
1. Acesse [railway.app](https://railway.app)
2. Click "Sign up with GitHub"
3. Autorize Railway acessar seus repositórios

### 2.2 Deploy do Python:
1. **Railway Dashboard** → "New Project"
2. **Deploy from GitHub repo** → Selecione seu repositório
3. **Configure Service**:
   - **Service Name**: `physics-engine`
   - **Root Directory**: `sim-engine`
   - **Build Command**: (deixe vazio - usa Dockerfile.railway)
   - **Start Command**: (deixe vazio - usa CMD do Docker)

### 2.3 Environment Variables:
**Railway → Service → Variables → Add**:
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
```

### 2.4 Aguardar Deploy:
- ⏱️ **Tempo**: ~3-5 minutos
- 📊 **Build Log**: Verifique se não há erros
- 🌐 **URL Gerada**: Railway fornecerá uma URL tipo `physics-engine-production-xxxx.up.railway.app`

---

## 📋 **PASSO 3: Testar Deployment**

### 3.1 Health Check:
```bash
curl https://SUA_URL_RAILWAY.railway.app/health
```
**Esperado**:
```json
{
  "status": "healthy",
  "service": "sim-engine",
  "version": "1.0.0",
  "timestamp": 1727234567.12,
  "environment": "production",
  "port": "8000"
}
```

### 3.2 Teste Endpoint de Simulação:
```bash
curl -X POST "https://SUA_URL_RAILWAY.railway.app/acceleration-curve/calculate" \
-H "Content-Type: application/json" \
-d '{
  "linear_velocity_threshold": 30,
  "initial_acceleration": 1.1,
  "velocity_increment": 1,
  "loss_factor": 46,
  "max_velocity": 160
}'
```
**Esperado**: JSON com 161 pontos de aceleração

---

## 📋 **PASSO 4: Documentar URLs**

Após deploy bem-sucedido, anote:

### 4.1 URLs de Produção:
- **Python Engine**: `https://physics-engine-production-xxxx.up.railway.app`
- **Health Check**: `/health`
- **Simulate**: `/simulate`
- **Acceleration Curve**: `/acceleration-curve/calculate`

### 4.2 Atualizar Configurações:
Essas URLs serão usadas para:
1. **Backend NestJS** (próxima fase)
2. **Frontend Angular** (Vercel)
3. **CORS Configuration**

---

## 🔧 **Troubleshooting**

### Se Build Falhar:
1. **Check Logs**: Railway → Deploy → View Logs
2. **Dockerfile**: Certifique-se que está usando `Dockerfile.railway`
3. **Root Directory**: Confirme que está `sim-engine`

### Se Health Check Falhar:
1. **URL Correta**: Use a URL gerada pelo Railway
2. **Cold Start**: Primeira requisição pode demorar 5-10s
3. **Port Issues**: Railway injeta PORT automaticamente

### Se CORS Bloquear:
1. **Frontend URL**: Atualize ALLOWED_ORIGINS após deploy do frontend
2. **Multiple Origins**: Separe com vírgula: `url1,url2,url3`

---

## 🎯 **Próximos Passos**

Após Python funcionando:

### Opção A: Deploy Incremental
1. **Deploy Backend NestJS** (Railway)
2. **Deploy Frontend Angular** (Vercel)
3. **Conectar todos os serviços**

### Opção B: Deploy Completo
- Me avise quando Python estiver funcionando
- Farei as configurações dos outros serviços

---

## 📊 **Status Checklist**

- ✅ **Arquivos Criados**: sim-engine/ prontos
- ✅ **Build Local**: Testado e funcionando
- ✅ **Commit Git**: 56dc76a criado
- ⏳ **GitHub Upload**: Você precisa fazer
- ⏳ **Railway Deploy**: Você precisa fazer
- ⏳ **Test Production**: Após deploy

---

## 🆘 **Precisa de Ajuda?**

**Se algo falhar**:
1. Copie a mensagem de erro completa
2. Me informe em qual passo parou
3. Posso ajudar a debugar

**Railway Limits (Free Tier)**:
- ✅ 512MB RAM
- ✅ $5 crédito/mês
- ✅ Deploy ilimitados
- ⚠️ Sleep após inatividade

---

**Começe agora**: Crie o repositório GitHub e me avise quando estiver pronto!

**Tempo estimado total**: 10-15 minutos