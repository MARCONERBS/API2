# Troubleshooting: Erro "Token does not exist in database"

## Erro Recebido

```json
{
  "error": "Invalid token. Token does not exist in database.",
  "code": "Token not found",
  "httpCode": "401"
}
```

## Possíveis Causas e Soluções

### 1. ✅ Token não existe no banco de dados

**Causa**: O token enviado não existe na tabela `whatsapp_instances`.

**Como verificar**:
```sql
-- No Supabase SQL Editor, execute:
SELECT id, name, instance_token, status, user_id 
FROM whatsapp_instances 
WHERE instance_token = 'SEU_TOKEN_AQUI';
```

**Soluções**:
- ✅ Verifique se copiou o token corretamente (sem espaços extras)
- ✅ Verifique se a instância foi criada corretamente
- ✅ Verifique se o token está salvo no banco após criar a instância

---

### 2. ✅ Token está NULL no banco

**Causa**: A coluna `instance_token` está NULL na instância.

**Como verificar**:
```sql
SELECT id, name, instance_token, status 
FROM whatsapp_instances 
WHERE id = 'ID_DA_INSTANCIA';
```

**Solução**:
- ✅ Reconecte a instância no painel
- ✅ Verifique se o token foi salvo após criar a instância
- ✅ Execute update manual se necessário:
  ```sql
  UPDATE whatsapp_instances 
  SET instance_token = 'NOVO_TOKEN' 
  WHERE id = 'ID_DA_INSTANCIA';
  ```

---

### 3. ✅ Problema com Política RLS (Row Level Security)

**Causa**: A política RLS não permite busca pública por `instance_token`.

**Como verificar**:
```sql
-- Verificar se a política existe
SELECT * FROM pg_policies 
WHERE tablename = 'whatsapp_instances' 
AND policyname = 'Public can validate instance tokens';
```

**Solução**:
- ✅ Execute a migration que cria a política:
  ```sql
  CREATE POLICY "Public can validate instance tokens"
    ON whatsapp_instances
    FOR SELECT
    TO anon
    USING (instance_token IS NOT NULL);
  ```

- ✅ Verifique se RLS está habilitado:
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE tablename = 'whatsapp_instances';
  ```

---

### 4. ✅ Token tem espaços ou caracteres especiais

**Causa**: O token copiado pode ter espaços extras no início/fim.

**Solução**:
- ✅ Remova espaços antes/depois do token
- ✅ Verifique se há quebras de linha (`\n` ou `\r`)
- ✅ Use `trim()` ao processar o token

**No n8n**:
- Use a função `{{ $json.token.trim() }}` se disponível
- Ou remova espaços manualmente antes de usar

---

### 5. ✅ Configuração do Cloudflare Worker

**Causa**: URLs ou chaves do Supabase incorretas no Worker.

**Como verificar**:
1. Acesse Cloudflare Dashboard → Workers
2. Verifique Environment Variables:
   - `SUPABASE_URL` está correto?
   - `SUPABASE_ANON_KEY` está correto?

**Solução**:
- ✅ Verifique os logs do Worker no Cloudflare
- ✅ Teste a query manualmente:
  ```bash
  curl "https://[SUPABASE_URL]/rest/v1/whatsapp_instances?instance_token=eq.SEU_TOKEN&select=id,status" \
    -H "apikey: [SUPABASE_ANON_KEY]" \
    -H "Authorization: Bearer [SUPABASE_ANON_KEY]"
  ```

---

### 6. ✅ Token de instância diferente do esperado

**Causa**: Você pode estar usando o token errado (de outra instância).

**Como verificar**:
1. Acesse o painel do cliente
2. Vá em "Instâncias"
3. Selecione a instância desejada
4. Verifique se está "Conectada" (status verde)
5. Vá em "API" e copie o token novamente

**Solução**:
- ✅ Use o token da instância que você quer usar
- ✅ Certifique-se que a instância está "Conectada"
- ✅ Não use token de instâncias desconectadas

---

## Checklist de Diagnóstico

Execute este checklist na ordem:

### Passo 1: Verificar Token no Banco
```sql
-- Substitua 'SEU_TOKEN' pelo token que está usando
SELECT 
  id,
  name,
  instance_token,
  status,
  user_id,
  created_at
FROM whatsapp_instances 
WHERE instance_token = 'SEU_TOKEN';
```

**Se não retornar nada**: Token não existe → Ver causa #1
**Se retornar NULL em instance_token**: Token está NULL → Ver causa #2
**Se retornar linha mas status != 'connected'**: Instância desconectada → Conecte a instância

---

### Passo 2: Verificar Política RLS
```sql
-- Verificar se política existe
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'whatsapp_instances'
AND policyname LIKE '%token%';
```

**Se não retornar nada**: Política não existe → Execute migration da causa #3

---

### Passo 3: Testar Query Manualmente
```bash
# Substitua as variáveis
SUPABASE_URL="https://agoyetuktxaknbonkwzz.supabase.co"
SUPABASE_ANON_KEY="sua_chave_aqui"
TOKEN="seu_token_aqui"

curl "${SUPABASE_URL}/rest/v1/whatsapp_instances?instance_token=eq.${TOKEN}&select=id,status,user_id,name" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json"
```

**Se retornar 401/403**: Problema de RLS → Ver causa #3
**Se retornar []**: Token não existe → Ver causa #1
**Se retornar dados**: Token existe → Problema pode ser no Worker

---

### Passo 4: Verificar Logs do Cloudflare Worker

1. Acesse Cloudflare Dashboard
2. Vá em Workers → Seu Worker → Logs
3. Procure por:
   - `[DEBUG] Token validation`
   - `[ERROR] Database query failed`
   - `[WARN] Token not found`

**Interpretação**:
- Se ver `Status: 200` mas `Found 0 instance(s)`: Token não existe no banco
- Se ver `Status: 401/403`: Problema de RLS
- Se ver `Status: 500`: Erro no banco ou configuração

---

## Solução Rápida: Recriar Instância

Se nada funcionar, tente recriar a instância:

1. **No Painel**:
   - Delete a instância antiga
   - Crie uma nova instância
   - Conecte a nova instância
   - Copie o novo token

2. **No n8n**:
   - Atualize o token no header
   - Teste novamente

---

## Debug no n8n

### Verificar Token Enviado

Adicione um nó "Set" antes do HTTP Request para ver o token:

```json
{
  "token_debug": "{{ $json.token }}",
  "token_length": "{{ $json.token.length }}",
  "token_first_10": "{{ $json.token.substring(0, 10) }}"
}
```

### Verificar Headers

No nó HTTP Request, verifique:
- ✅ Header name: `token` (exatamente assim, minúsculo)
- ✅ Header value: Token completo sem espaços
- ✅ URL: `https://api.evasend.com.br/whatsapp/send-text`

---

## Exemplo de Query SQL para Debug

```sql
-- Ver todas as instâncias com seus tokens
SELECT 
  id,
  name,
  LEFT(instance_token, 20) || '...' as token_preview,
  LENGTH(instance_token) as token_length,
  status,
  user_id,
  created_at
FROM whatsapp_instances
ORDER BY created_at DESC;

-- Buscar token específico (substitua 'SEU_TOKEN')
SELECT *
FROM whatsapp_instances
WHERE instance_token = 'SEU_TOKEN';

-- Verificar se há tokens duplicados
SELECT instance_token, COUNT(*) as count
FROM whatsapp_instances
WHERE instance_token IS NOT NULL
GROUP BY instance_token
HAVING COUNT(*) > 1;
```

---

## Contato

Se o problema persistir após seguir todos os passos:
1. ✅ Verifique os logs do Cloudflare Worker
2. ✅ Execute as queries SQL acima
3. ✅ Verifique a política RLS
4. ✅ Teste a query manualmente com curl

Com essas informações, será mais fácil identificar o problema específico.

