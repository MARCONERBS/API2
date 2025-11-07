# Guia: Rate Limiting Implementado

## 📊 Configuração Atual

### Limites Configurados

- **Limite por IP**: 1000 requisições/minuto
- **Limite por Token**: 1000 requisições/minuto
- **Janela de Tempo**: 1 minuto (deslizante)
- **Limite Restritivo**: 100 req/min (reservado para casos especiais)

### Como Funciona

1. **Duplo Limite**: A requisição é bloqueada se **qualquer um** dos limites for excedido:
   - Limite por IP **OU**
   - Limite por Token

2. **Janela Deslizante**: 
   - Janela de 1 minuto que se renova continuamente
   - Contador é resetado a cada minuto

3. **Cache Persistente**:
   - Usa Cache API do Cloudflare
   - Contadores persistem entre requisições
   - Expiração automática após 2 minutos

---

## 🔒 Resposta quando Limite é Excedido

### Status Code: `429 Too Many Requests`

```json
{
  "error": "Rate limit exceeded for IP. Limit: 1000 req/min",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 1000,
  "remaining": 0,
  "reset": "2025-11-06T20:40:00.000Z"
}
```

### Headers Retornados

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1733520000000
Retry-After: 45
```

---

## 📈 Headers de Resposta (Sucesso)

Todas as respostas incluem headers de rate limit:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1733520000000
```

### Interpretação

- **X-RateLimit-Limit**: Limite máximo de requisições
- **X-RateLimit-Remaining**: Requisições restantes no minuto atual
- **X-RateLimit-Reset**: Timestamp (ms) quando o contador será resetado

---

## ⚙️ Ajustar Limites

### Editar no Código

```javascript
// No arquivo cloudflare-worker-improved.js

// Limite padrão (ajuste conforme necessário)
const RATE_LIMIT_REQUESTS_PER_MINUTE = 1000; // ou 500, 200, etc.

// Limite restritivo (para casos suspeitos)
const RATE_LIMIT_STRICT = 100; // ou 50, 10, etc.
```

### Limites Recomendados

| Uso | Limite Recomendado |
|-----|-------------------|
| Desenvolvimento/Teste | 100-200 req/min |
| Produção Normal | 500-1000 req/min |
| Alta Demanda | 2000-5000 req/min |
| Proteção Anti-DDoS | 50-100 req/min |

---

## 🧪 Testar Rate Limiting

### Teste Básico

```bash
# Enviar 10 requisições rapidamente
for i in {1..10}; do
  curl -X POST https://api.evasend.com.br/whatsapp/send-text \
    -H "Content-Type: application/json" \
    -H "token: seu_token_aqui" \
    -d '{"number":"5511999999999","text":"Teste '$i'"}' \
    -v 2>&1 | grep "X-RateLimit"
done
```

### Verificar Headers

```bash
curl -X POST https://api.evasend.com.br/whatsapp/send-text \
  -H "Content-Type: application/json" \
  -H "token: seu_token_aqui" \
  -d '{"number":"5511999999999","text":"Teste"}' \
  -i | grep "X-RateLimit"
```

---

## 🔍 Como Identificar IP e Token

### IP do Cliente

O Worker usa, nesta ordem:
1. `CF-Connecting-IP` (header do Cloudflare)
2. `X-Forwarded-For` (fallback)
3. `unknown` (se nenhum disponível)

### Token

Extraído do header `token` da requisição.

---

## ⚠️ Comportamento em Caso de Erro

Se o rate limiting falhar (erro no cache), a requisição **será permitida** para evitar bloqueios indevidos. O erro será logado no Cloudflare.

---

## 📊 Monitoramento

### Logs do Cloudflare Worker

Acesse: Cloudflare Dashboard → Workers → Seu Worker → Logs

Procure por:
- `[ERROR] Rate limit check failed` - Erros no rate limiting
- Status `429` - Requisições bloqueadas

### Métricas

- Total de requisições bloqueadas (status 429)
- Requisições por IP/token
- Tempo de resposta do rate limiting

---

## 🚀 Otimizações

### Cache API do Cloudflare

- **Vantagem**: Persiste entre requisições
- **Desvantagem**: Pode ter latência (10-50ms)
- **Performance**: Aceitável para rate limiting

### Alternativas (Futuro)

1. **Cloudflare KV** (Plano Pago)
   - Mais rápido que Cache API
   - Melhor para contadores distribuídos

2. **Durable Objects** (Plano Pago)
   - Estado consistente globalmente
   - Ideal para rate limiting preciso

3. **Cloudflare Rate Limiting** (WAF)
   - Gerenciado pelo Cloudflare
   - Mais fácil de configurar
   - Requer plano pago

---

## ✅ Status

**Rate Limiting**: ✅ **IMPLEMENTADO**

- ✅ Limite por IP: 1000 req/min
- ✅ Limite por Token: 1000 req/min
- ✅ Headers de resposta
- ✅ Código de erro 429
- ✅ Cache persistente

---

## 📝 Exemplo de Uso no n8n

### Tratamento de Rate Limit

```javascript
// No n8n, adicione tratamento de erro
if ($json.statusCode === 429) {
  // Rate limit excedido
  const retryAfter = $json.headers['retry-after'] || 60;
  
  // Aguardar antes de tentar novamente
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  
  // Tentar novamente
  return await $http.request(...);
}
```

---

## 🎯 Próximos Passos

1. ✅ Deploy do Worker atualizado
2. ✅ Testar rate limiting
3. ⚠️ Monitorar logs e métricas
4. ⚠️ Ajustar limites conforme necessário
5. ⚠️ Considerar Cloudflare KV para melhor performance (opcional)

---

## 📞 Suporte

Se precisar ajustar limites ou tiver problemas:
1. Verifique os logs do Cloudflare Worker
2. Teste com curl para verificar headers
3. Ajuste as constantes no código conforme necessário

