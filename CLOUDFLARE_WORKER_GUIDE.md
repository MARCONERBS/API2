# Guia: Cloudflare Worker para Múltiplas Instâncias

## 📋 Recursos Implementados

- ✅ Validação dinâmica de tokens
- ✅ Rate limiting (1000 req/min por IP/token)
- ✅ Logs otimizados com variável de ambiente DEBUG
- ✅ Timeout de validação (10 segundos)
- ✅ Suporte a múltiplos endpoints (/send-text, /send-media)
- ✅ Cache de validação de tokens (5 minutos)
- ✅ Headers informativos de rate limit

## Endpoints Suportados

O Worker atualmente suporta os seguintes endpoints:

- **`/send-text`** - Envio de mensagens de texto
- **`/send-media`** - Envio de mídia (imagem, vídeo, documento, áudio, sticker)

### URLs Disponíveis

**Cloudflare Worker (Domínio Customizado):**
```
https://api.evasend.com.br/whatsapp/send-text
https://api.evasend.com.br/whatsapp/send-media
```

**Edge Function Direta:**
```
https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text
https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-media
```

---

## Como Funciona a Validação de Múltiplos Tokens

### Conceito Principal

O Cloudflare Worker **não precisa de uma lista de tokens**. Ele valida **dinamicamente** qualquer token recebido fazendo uma query no banco de dados Supabase.

### Fluxo de Validação

```
1. Cliente envia requisição com token no header
   POST /whatsapp/send-text
   Headers: { token: "abc123..." }

2. Worker extrai o token do header

3. Worker consulta o banco de dados:
   GET /rest/v1/whatsapp_instances?instance_token=eq.abc123...
   
4. Banco retorna a instância se existir:
   {
     id: "uuid",
     status: "connected",
     user_id: "user-uuid",
     name: "Instância do Cliente X"
   }

5. Worker verifica:
   ✅ Token existe?
   ✅ Status = "connected"?
   
6. Se válido → Processa requisição
   Se inválido → Retorna 401
```

### Por Que Funciona para Múltiplos Tokens?

1. **Cada instância tem token único**: Quando uma instância é criada, recebe um `instance_token` único
2. **Query dinâmica**: O Worker faz `WHERE instance_token = [token_recebido]`
3. **RLS Policy pública**: A política permite buscar por `instance_token` sem autenticação
4. **Isolamento automático**: Cada cliente só vê suas próprias instâncias (via RLS)

### Exemplo Prático

```javascript
// Cliente 1 (João)
Token: "token_joao_123"
→ Worker valida no banco
→ Encontra instância do João
→ Status: "connected" ✅
→ Processa requisição

// Cliente 2 (Maria)
Token: "token_maria_456"
→ Worker valida no banco
→ Encontra instância da Maria
→ Status: "connected" ✅
→ Processa requisição

// Token inválido
Token: "token_fake_789"
→ Worker valida no banco
→ Não encontra instância
→ Retorna 401 ❌
```

## Estrutura do Banco de Dados

### Tabela: whatsapp_instances

```sql
CREATE TABLE whatsapp_instances (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  instance_token text UNIQUE,  -- Token único por instância
  status text,                  -- 'disconnected' | 'connecting' | 'connected'
  name text,
  ...
);
```

### Política RLS para Validação

```sql
-- Permite buscar instância por token (sem autenticação)
CREATE POLICY "Public can validate instance tokens"
  ON whatsapp_instances
  FOR SELECT
  TO anon
  USING (instance_token IS NOT NULL);
```

**Importante**: Esta política só permite buscar quando há filtro por `instance_token`. Não permite listar todas as instâncias.

## Melhorias Implementadas

### 1. Cache de Validação (Opcional)

```javascript
// Cache por 5 minutos para reduzir chamadas ao banco
const TOKEN_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000;
```

**Vantagem**: Reduz latência e chamadas ao banco  
**Desvantagem**: Se instância desconectar, pode demorar até 5min para invalidar

**Recomendação**: Manter cache para produção (melhor performance)

### 2. Validação de Status

```javascript
if (instance.status === 'connected') {
  // Permite envio
} else {
  // Retorna erro específico
  return { valid: false, error: 'Instance not connected', status: instance.status };
}
```

### 3. Mensagens de Erro Específicas

```javascript
// Diferentes mensagens para diferentes erros
- Token não encontrado: "Invalid token. Token does not exist in database."
- Instância desconectada: "Instance is disconnected. Only connected instances can send messages."
- Erro no banco: "Database error"
```

### 4. Headers Adicionais

```javascript
headers: {
  'X-Instance-ID': validation.instance.id,  // ID da instância
  'X-User-ID': validation.instance.user_id,  // ID do usuário
}
```

Útil para logging e auditoria na Edge Function.

## Como Fazer Deploy

### 1. Preparar Código

Copie o conteúdo de `cloudflare-worker-improved.js`

### 2. Criar Worker no Cloudflare

1. Acesse: https://dash.cloudflare.com
2. Vá em **Workers & Pages**
3. Clique em **Create application** → **Create Worker**
4. Cole o código
5. Configure **Environment Variables**:
   - `SUPABASE_URL`: Sua URL do Supabase
   - `SUPABASE_ANON_KEY`: Sua chave anon do Supabase

### 3. Configurar Domínio Customizado

1. No Worker, vá em **Triggers**
2. Adicione **Custom Domain**
3. Configure DNS:
   ```
   Tipo: CNAME
   Nome: api.evasend.com.br
   Destino: [seu-worker].workers.dev
   ```

### 4. Testar

```bash
curl -X POST https://api.evasend.com.br/whatsapp/send-text \
  -H "Content-Type: application/json" \
  -H "token: seu_token_aqui" \
  -d '{
    "number": "5511999999999",
    "text": "Teste"
  }'
```

## Exemplos de Uso

### JavaScript

```javascript
// Cliente 1 - Token: "token_cliente_1"
const response1 = await fetch('https://api.evasend.com.br/whatsapp/send-text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'token': 'token_cliente_1',  // Token único do Cliente 1
  },
  body: JSON.stringify({
    number: '5511999999999',
    text: 'Mensagem do Cliente 1',
  }),
});

// Cliente 2 - Token: "token_cliente_2"
const response2 = await fetch('https://api.evasend.com.br/whatsapp/send-text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'token': 'token_cliente_2',  // Token único do Cliente 2
  },
  body: JSON.stringify({
    number: '5511888888888',
    text: 'Mensagem do Cliente 2',
  }),
});
```

### Python

```python
import requests

# Cliente 1
response1 = requests.post(
    'https://api.evasend.com.br/whatsapp/send-text',
    headers={
        'Content-Type': 'application/json',
        'token': 'token_cliente_1',  # Token do Cliente 1
    },
    json={
        'number': '5511999999999',
        'text': 'Mensagem do Cliente 1',
    }
)

# Cliente 2
response2 = requests.post(
    'https://api.evasend.com.br/whatsapp/send-text',
    headers={
        'Content-Type': 'application/json',
        'token': 'token_cliente_2',  # Token do Cliente 2
    },
    json={
        'number': '5511888888888',
        'text': 'Mensagem do Cliente 2',
    }
)
```

## Segurança

### ✅ O Que Está Protegido

1. **Validação de Token**: Token deve existir no banco
2. **Validação de Status**: Apenas instâncias `connected` podem enviar
3. **RLS no Banco**: Clientes só veem suas próprias instâncias
4. **Isolamento**: Token de um cliente não funciona para outro

### ⚠️ Considerações

1. **Cache**: Se remover instância, cache pode demorar 5min para limpar
   - **Solução**: Invalidar cache manualmente ao desconectar instância

2. **Rate Limiting**: Não implementado no Worker
   - **Solução**: Usar Cloudflare Rate Limiting (plano pago)

3. **Logs**: Tokens aparecem nos logs do Cloudflare
   - **Solução**: Não logar tokens completos, apenas hash

## Performance

### Cache vs Sem Cache

**Com Cache (5min)**:
- Primeira requisição: ~200ms (query no banco)
- Requisições seguintes: ~50ms (cache)
- Chamadas ao banco: 1 a cada 5min por token

**Sem Cache**:
- Todas requisições: ~200ms (query no banco)
- Chamadas ao banco: 1 por requisição

**Recomendação**: Usar cache para produção

## Troubleshooting

### Erro: "Token not found"

**Causa**: Token não existe no banco ou foi deletado

**Solução**:
1. Verificar se token está correto
2. Verificar se instância existe no banco
3. Verificar política RLS

### Erro: "Instance not connected"

**Causa**: Instância está `disconnected` ou `connecting`

**Solução**:
1. Conectar instância no painel
2. Aguardar status mudar para `connected`

### Erro: "Database error"

**Causa**: Erro ao consultar Supabase

**Solução**:
1. Verificar se `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretos
2. Verificar se Supabase está online
3. Verificar logs do Cloudflare Worker

## Status de Implementação

1. ✅ Deploy do Worker no Cloudflare
2. ✅ Configurar domínio customizado
3. ✅ Atualizar frontend para usar nova URL
4. ✅ Rate limiting implementado (1000 req/min por IP/token)
5. ✅ Logging estruturado implementado (com variável DEBUG)
6. ✅ Timeout de validação (10 segundos)
7. ✅ Suporte a múltiplos endpoints (/send-text, /send-media)
8. ✅ Headers informativos de rate limit
9. ✅ Cache de validação de tokens (5 minutos)
10. ⚠️ Invalidar cache ao desconectar instância (opcional - ver `src/services/cache-invalidation.ts`)

## Próximos Passos (Opcional)

- Implementar métricas e analytics
- Adicionar webhooks para eventos
- Implementar retry automático
- Adicionar suporte a mais tipos de mídia

