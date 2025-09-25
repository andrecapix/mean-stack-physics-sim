# 🚀 Python FastAPI - Deploy Guide

## ✅ Arquivos Prontos para Deploy

### Estrutura de Deploy:
```
sim-engine/
├── engine/                    # Código da simulação física
├── main.production.py         # 🆕 App otimizada para produção
├── requirements.production.txt # 🆕 Dependencies mínimas
├── Dockerfile.railway         # 🆕 Dockerfile para Railway/Render
└── DEPLOY_README.md          # Este arquivo
```

## 📦 Imagem Docker Testada

**Status**: ✅ **FUNCIONANDO PERFEITAMENTE**
- **Build Size**: 338MB (otimizada)
- **Health Check**: ✅ `/health` retorna status detalhado
- **Endpoints**: ✅ `/simulate` e `/acceleration-curve/calculate`
- **CORS**: ✅ Configurado para produção

## 🚀 Deploy no Railway

### 1. Conectar Repositório:
- Railway → New Project → Deploy from GitHub
- Selecione este repositório
- Root Directory: `sim-engine/`

### 2. Configurar Build:
- **Build Command**: `docker build -f Dockerfile.railway -t app .`
- **Start Command**: (deixe vazio - Docker cuidará)

### 3. Variáveis de Ambiente:
```env
PORT=8000                                    # Railway injeta automaticamente
ALLOWED_ORIGINS=https://seu-frontend.vercel.app,https://seu-backend.railway.app
NODE_ENV=production
```

### 4. Verificar Deploy:
```bash
curl https://seu-python.railway.app/health
# Deve retornar: {"status":"healthy","service":"sim-engine",...}
```

## 🎯 Deploy no Render

### 1. Conectar Repositório:
- Render → New Web Service → Connect Repository
- Root Directory: `sim-engine/`

### 2. Configurações:
- **Environment**: Docker
- **Build Command**: (vazio - usa Dockerfile.railway)
- **Start Command**: (vazio - usa CMD do Dockerfile)

### 3. Variáveis:
- Mesmas do Railway acima

## 🔧 URLs de Produção

Após deploy, seus endpoints serão:
- **Health**: `https://seu-app.railway.app/health`
- **Simulate**: `https://seu-app.railway.app/simulate`
- **Acceleration Curve**: `https://seu-app.railway.app/acceleration-curve/calculate`

## 📊 Performance Esperada

- **Cold Start**: 2-5 segundos (Railway/Render)
- **Warm Response**: <200ms para cálculos simples
- **Memory Usage**: ~50-80MB em runtime
- **Uptime**: 99%+ (free tier limitations)

## 🆘 Troubleshooting

### Se /health falhar:
1. Verifique logs: `railway logs` ou Render dashboard
2. Confirme PORT environment variable
3. Verifique se container startou corretamente

### Se CORS der erro:
1. Adicione seu frontend URL em ALLOWED_ORIGINS
2. Formato: `https://domain1.com,https://domain2.com`

### Memory/Timeout Issues:
- Railway free tier: 512MB RAM
- Render free tier: 512MB RAM + 15min sleep
- Para workloads maiores, considere upgrade

## 🎯 Next Steps

Após deploy Python, prosseguir com:
1. **Backend NestJS** deployment
2. **Frontend Angular** no Vercel
3. **Conexão entre serviços**
4. **Environment variables** finais

---

**Status**: 🟢 Pronto para deployment
**Última atualização**: 25/09/2025 - 02:45 UTC
**Testado**: ✅ Build local + Runtime + Endpoints