# 🚀 NestJS Backend - Deploy Guide

## ✅ Arquivos Prontos para Deploy

### Estrutura de Deploy:
```
mean-api/
├── src/                         # Código NestJS completo
├── Dockerfile.railway           # 🆕 Dockerfile otimizado para Railway
├── .env.production             # 🆕 Environment variables de produção
├── package.json                # Dependencies e scripts
└── DEPLOY_README.md            # Este arquivo
```

## 📦 Configuração Pronta

**Status**: ✅ **READY FOR DEPLOYMENT**
- **Multi-stage build**: Otimizado para produção
- **MongoDB Atlas**: Já conectado e testado
- **Python Integration**: URL de produção configurada
- **Health Check**: Endpoint `/health` configurado
- **CORS**: Configurado para frontend Vercel

## 🔑 **Environment Variables para Railway**

```env
# MongoDB Atlas (já testado)
MONGODB_URI=mongodb+srv://mean_user:iKep8flhqpO2zR4m@cluster0.o921m.mongodb.net/rail-sim?retryWrites=true&w=majority&appName=Cluster0

# JWT Secrets (IMPORTANTE: Generate novos no Railway)
JWT_SECRET=your-production-jwt-secret-here
REFRESH_SECRET=your-production-refresh-secret-here

# URLs de serviços
PYTHON_SERVICE_URL=https://mean-stack-physics-sim-production.up.railway.app
CORS_ORIGIN=https://seu-frontend.vercel.app,http://localhost:4200

# Server config
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

## 🚀 Deploy no Railway

### 1. Novo Serviço:
- Railway Dashboard → **"New Service"**
- **Deploy from GitHub** → `andrecapix/mean-stack-physics-sim`
- **Root Directory**: `mean-api`

### 2. Configurações:
```yaml
Service Name: mean-backend
Root Directory: mean-api
Build Command: (deixar vazio - usa Dockerfile.railway)
Start Command: (deixar vazio - usa CMD do Docker)
```

### 3. Environment Variables:
**⚠️ IMPORTANT**: Configure no Railway Settings → Variables:
```env
MONGODB_URI=mongodb+srv://mean_user:iKep8flhqpO2zR4m@cluster0.o921m.mongodb.net/rail-sim?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=generate-strong-secret-here
REFRESH_SECRET=generate-another-strong-secret-here
PYTHON_SERVICE_URL=https://mean-stack-physics-sim-production.up.railway.app
NODE_ENV=production
```

### 4. Generate Domain:
- **Port**: `3000`
- **URL será**: `https://mean-backend-production-xxxx.up.railway.app`

## 📋 **Endpoints Disponíveis**

Após deploy, você terá:

### **Auth Endpoints:**
- **POST** `/auth/register` - User registration
- **POST** `/auth/login` - User login
- **POST** `/auth/refresh` - Refresh token
- **GET** `/auth/profile` - User profile

### **Simulation Endpoints:**
- **POST** `/simulation` - Create simulation
- **GET** `/simulation/:id` - Get simulation
- **GET** `/simulation` - List simulations (paginated)

### **Acceleration Curve Endpoints:**
- **POST** `/acceleration-curve/calculate` - Calculate curve
- **POST** `/acceleration-curve/save` - Save curve
- **GET** `/acceleration-curve/list` - List saved curves

### **System Endpoints:**
- **GET** `/health` - Health check

## 🧪 **Testing Endpoints**

### Health Check:
```bash
curl https://your-backend.railway.app/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Register User:
```bash
curl -X POST "https://your-backend.railway.app/auth/register" \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Login:
```bash
curl -X POST "https://your-backend.railway.app/auth/login" \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com","password":"password123"}'
```

## 🔧 **Troubleshooting**

### Build Issues:
1. Check logs: Railway → Deploy → View Logs
2. Verify `package.json` scripts
3. Ensure `Dockerfile.railway` is used

### Database Connection:
1. Test MongoDB Atlas connection locally first
2. Verify MONGODB_URI format
3. Check network access in Atlas

### JWT Issues:
1. Generate strong secrets (32+ chars)
2. Don't use default secrets from .env.example
3. Verify JWT_SECRET in Railway env vars

## 📊 **Expected Performance**

- **Build Time**: ~2-3 minutes
- **Cold Start**: <5 seconds
- **Response Time**: <100ms for basic endpoints
- **Memory Usage**: ~120-150MB

## 🎯 **Next Steps**

Após backend funcionando:
1. **Frontend Deploy** (Vercel)
2. **Update CORS_ORIGIN** com URL real do frontend
3. **Test integração** Python → NestJS → Frontend
4. **Production testing** completo

---

**Ready for deployment!** 🚀
Todos os arquivos estão configurados e testados.