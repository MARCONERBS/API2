# Fluxo: Múltiplas Instâncias com Cloudflare Worker

## Diagrama de Funcionamento

```
┌─────────────────────────────────────────────────────────────────┐
│                    CENÁRIO: 3 CLIENTES                           │
└─────────────────────────────────────────────────────────────────┘

Cliente 1 (João)          Cliente 2 (Maria)         Cliente 3 (Pedro)
Token: "abc123"            Token: "def456"            Token: "ghi789"
Instância: "Vendas"        Instância: "Suporte"       Instância: "Marketing"
```

## Fluxo de Requisição

```
┌──────────────┐
│   Cliente 1  │
│  Token: abc  │
└──────┬───────┘
       │
       │ POST /whatsapp/send-text
       │ Headers: { token: "abc123" }
       │
       ▼
┌─────────────────────────────────────┐
│   Cloudflare Worker                 │
│   (api.evasend.com.br)              │
└──────┬───────────────────────────────┘
       │
       │ 1. Extrai token: "abc123"
       │
       ▼
┌─────────────────────────────────────┐
│   Validação Dinâmica                │
│                                      │
│   Query no Supabase:                │
│   GET /rest/v1/whatsapp_instances   │
│   ?instance_token=eq.abc123          │
└──────┬───────────────────────────────┘
       │
       │ 2. Banco retorna:
       │    {
       │      id: "uuid-joao",
       │      status: "connected",
       │      user_id: "user-joao",
       │      name: "Vendas"
       │    }
       │
       ▼
┌─────────────────────────────────────┐
│   Verificação                        │
│                                      │
│   ✅ Token existe? SIM               │
│   ✅ Status = "connected"? SIM      │
└──────┬───────────────────────────────┘
       │
       │ 3. Token válido! Processa...
       │
       ▼
┌─────────────────────────────────────┐
│   Proxy para Edge Function          │
│                                      │
│   POST /functions/v1/send-text      │
│   Headers: {                         │
│     token: "abc123",                 │
│     X-Instance-ID: "uuid-joao"      │
│   }                                  │
└──────┬───────────────────────────────┘
       │
       │ 4. Edge Function processa
       │
       ▼
┌─────────────────────────────────────┐
│   API Externa WhatsApp               │
│   sender.uazapi.com                 │
└──────┬───────────────────────────────┘
       │
       │ 5. Envia mensagem
       │
       ▼
┌──────────────┐
│   Resposta   │
│   {success}  │
└──────────────┘
```

## Exemplo: 3 Requisições Simultâneas

### Requisição 1 - Cliente João
```http
POST https://api.evasend.com.br/whatsapp/send-text
Headers:
  token: abc123
Body:
  {
    "number": "5511999999999",
    "text": "Olá do João"
  }
```

**Validação**:
- Worker busca: `instance_token = 'abc123'`
- Encontra: Instância do João (status: connected) ✅
- Processa requisição

---

### Requisição 2 - Cliente Maria
```http
POST https://api.evasend.com.br/whatsapp/send-text
Headers:
  token: def456
Body:
  {
    "number": "5511888888888",
    "text": "Olá da Maria"
  }
```

**Validação**:
- Worker busca: `instance_token = 'def456'`
- Encontra: Instância da Maria (status: connected) ✅
- Processa requisição

---

### Requisição 3 - Cliente Pedro (Desconectado)
```http
POST https://api.evasend.com.br/whatsapp/send-text
Headers:
  token: ghi789
Body:
  {
    "number": "5511777777777",
    "text": "Olá do Pedro"
  }
```

**Validação**:
- Worker busca: `instance_token = 'ghi789'`
- Encontra: Instância do Pedro (status: disconnected) ❌
- Retorna: `401 - Instance is disconnected`

---

## Banco de Dados - Estado

```sql
-- Tabela: whatsapp_instances

| id       | user_id  | instance_token | status      | name     |
|----------|----------|----------------|-------------|----------|
| uuid-1   | user-joao| abc123         | connected   | Vendas   |
| uuid-2   | user-maria| def456        | connected   | Suporte  |
| uuid-3   | user-pedro| ghi789        | disconnected| Marketing|
```

**Observação**: Cada linha tem um `instance_token` único. O Worker valida qualquer token fazendo query dinâmica.

## Cache de Validação

```
┌─────────────────────────────────────────┐
│   Cache (Map)                           │
│                                         │
│   "abc123" → {                          │
│     valid: true,                        │
│     instance: {...},                    │
│     timestamp: 1234567890               │
│   }                                     │
│                                         │
│   "def456" → {                          │
│     valid: true,                        │
│     instance: {...},                   │
│     timestamp: 1234567891               │
│   }                                     │
└─────────────────────────────────────────┘
```

**Comportamento**:
1. Primeira requisição com token → Query no banco → Salva no cache
2. Próximas requisições (até 5min) → Usa cache → Mais rápido
3. Após 5min → Cache expira → Query no banco novamente

## Vantagens da Abordagem

### ✅ Escalabilidade
- **Não precisa** manter lista de tokens no Worker
- **Não precisa** atualizar Worker quando novo cliente é criado
- Suporta **ilimitadas** instâncias

### ✅ Segurança
- Cada token é validado no banco em tempo real
- RLS garante isolamento entre clientes
- Apenas instâncias `connected` podem enviar

### ✅ Performance
- Cache reduz latência (50ms vs 200ms)
- Cache reduz carga no banco
- Cloudflare Edge Network (baixa latência global)

### ✅ Manutenibilidade
- Código simples e direto
- Não precisa sincronizar tokens
- Fácil de debugar

## Comparação: Lista de Tokens vs Validação Dinâmica

### ❌ Abordagem Antiga (Lista de Tokens)

```javascript
// Worker precisa ter lista hardcoded
const VALID_TOKENS = [
  'abc123',  // Cliente 1
  'def456',  // Cliente 2
  'ghi789',  // Cliente 3
];

// Problemas:
// - Precisa atualizar Worker a cada novo cliente
// - Não escala bem
// - Tokens expostos no código
```

### ✅ Abordagem Atual (Validação Dinâmica)

```javascript
// Worker valida qualquer token no banco
async function validateToken(token) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/whatsapp_instances?instance_token=eq.${token}`
  );
  // ...
}

// Vantagens:
// - Funciona para qualquer token
// - Escala automaticamente
// - Tokens seguros no banco
```

## Resumo

**Pergunta**: Como o Worker recebe de várias instâncias com tokens diferentes?

**Resposta**: 
1. Worker **não tem lista de tokens**
2. Worker **valida dinamicamente** qualquer token recebido
3. Faz **query no banco**: `WHERE instance_token = [token_recebido]`
4. Se encontrar e estiver `connected` → Processa
5. Se não encontrar ou estiver desconectado → Rejeita

**Resultado**: Um único Worker suporta **ilimitadas instâncias** sem configuração adicional! 🚀

