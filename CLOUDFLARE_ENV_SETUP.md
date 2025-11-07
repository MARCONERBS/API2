# Configuração de Variáveis de Ambiente - Cloudflare Worker

## 📋 Variáveis de Ambiente Disponíveis

### DEBUG (Opcional)
- **Descrição**: Habilita logs detalhados para debugging
- **Valores**: `true` ou `false`
- **Padrão**: `false` (produção)
- **Uso**: Ativar apenas durante desenvolvimento/debugging

---

## 🚀 Como Configurar no Cloudflare

### Passo 1: Acessar Settings do Worker

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **Workers & Pages**
3. Selecione seu Worker
4. Clique em **Settings**
5. Role até **Variables**

### Passo 2: Adicionar Variáveis

Adicione as seguintes variáveis:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `DEBUG` | `false` | Desabilita logs detalhados (produção) |
| `SUPABASE_URL` | `https://ctshqbxxlauulzsbapjb.supabase.co` | URL do Supabase (opcional - já no código) |
| `SUPABASE_ANON_KEY` | `sua_chave_aqui` | Chave anon do Supabase (opcional - já no código) |

### Passo 3: Configurar para Produção

**Produção (Recomendado)**:
```
DEBUG = false
```

**Desenvolvimento/Debug**:
```
DEBUG = true
```

---

## 📝 No Código

O código já está configurado para usar variáveis de ambiente:

```javascript
// Atual (hardcoded)
const DEBUG_MODE = false;

// Para usar variável de ambiente (descomente e ajuste):
// const DEBUG_MODE = (typeof DEBUG !== 'undefined' ? DEBUG === 'true' : false);
```

### Para Ativar Variável de Ambiente

Edite o arquivo `cloudflare-worker-improved.js` e altere:

```javascript
// De:
const DEBUG_MODE = false;

// Para:
const DEBUG_MODE = (typeof DEBUG !== 'undefined' ? DEBUG === 'true' : false);
```

---

## 🔍 O Que é Logado

### Com DEBUG = false (Produção)
- ✅ Erros críticos (sem stack trace)
- ✅ Avisos importantes (sem informações sensíveis)
- ❌ Logs de debug detalhados
- ❌ Tokens parciais
- ❌ URLs completas

### Com DEBUG = true (Desenvolvimento)
- ✅ Todos os logs
- ✅ Stack traces completos
- ✅ URLs e tokens parciais
- ✅ Informações detalhadas de validação

---

## 🛡️ Segurança

### Informações NUNCA Logadas (mesmo em DEBUG)

- ❌ Tokens completos
- ❌ Senhas
- ❌ Dados pessoais sensíveis
- ❌ Chaves de API completas

### Informações Logadas em DEBUG

- ⚠️ Tokens parciais (primeiros 20 caracteres)
- ⚠️ URLs parciais (primeiros 100 caracteres)
- ⚠️ IDs de instância
- ⚠️ Stack traces

---

## 📊 Comparação de Logs

### Exemplo: Erro de Validação

**DEBUG = false (Produção)**:
```
[ERROR] Token validation exception: Token validation failed
```

**DEBUG = true (Desenvolvimento)**:
```
[ERROR] Exception validating token: Error: Network error
    at validateToken (worker.js:45:12)
    at handleRequest (worker.js:123:8)
```

---

## ✅ Recomendações

1. **Produção**: Sempre use `DEBUG = false`
2. **Desenvolvimento**: Use `DEBUG = true` temporariamente
3. **Monitoramento**: Use Cloudflare Analytics para métricas
4. **Logs Críticos**: Sempre são logados (mesmo em produção)

---

## 🔄 Atualizar Código para Usar Env Vars

Se quiser usar variáveis de ambiente para tudo:

```javascript
// Substitua valores hardcoded por:
const SUPABASE_URL = SUPABASE_URL || 'https://ctshqbxxlauulzsbapjb.supabase.co';
const SUPABASE_ANON_KEY = SUPABASE_ANON_KEY || 'sua_chave_padrao';
const DEBUG_MODE = (typeof DEBUG !== 'undefined' ? DEBUG === 'true' : false);
const RATE_LIMIT_REQUESTS_PER_MINUTE = parseInt(RATE_LIMIT || '1000');
```

---

## 📞 Troubleshooting

### Logs não aparecem

- Verifique se `DEBUG = true` está configurado
- Verifique Cloudflare Dashboard → Workers → Logs
- Logs podem ter delay de alguns segundos

### Muitos logs em produção

- Certifique-se que `DEBUG = false`
- Verifique se há `console.log` fora de `if (DEBUG_MODE)`

---

## 🎯 Status Atual

✅ **Logs Otimizados**
- Logs de debug condicionados
- Logs de erro críticos sempre ativos
- Sem informações sensíveis em produção
- Pronto para usar variáveis de ambiente

