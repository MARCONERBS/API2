# WhatsApp Manager API

Sistema completo de envio de mensagens WhatsApp com suporte a múltiplas instâncias isoladas, rate limiting, validação dinâmica de tokens e envio de mídia.

## 🚀 Recursos

- **Múltiplas Instâncias Isoladas** - Cada cliente pode ter várias instâncias WhatsApp
- **Validação Dinâmica de Tokens** - Tokens validados em tempo real no banco de dados
- **Rate Limiting** - Proteção contra abuso (1000 req/min por IP/token)
- **Envio de Texto e Mídia** - Suporte completo para mensagens e arquivos
- **Logs Otimizados** - Logs detalhados para debugging e monitoramento
- **Timeout Inteligente** - Validação com timeout automático de 10 segundos
- **Variáveis de Ambiente** - Configuração flexível via env vars
- **Cloudflare Worker** - Gateway com domínio customizado e cache

## 📋 Endpoints Disponíveis

### Envio de Texto
```
POST /send-text
```

### Envio de Mídia
```
POST /send-media
```

**Tipos de mídia suportados:** `image`, `video`, `document`, `audio`, `myaudio`, `ptt`, `sticker`

## 🔗 URLs

### Edge Function Direta (Recomendado)
```
https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text
https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-media
```

### Cloudflare Worker (Domínio Customizado)
```
https://api.evasend.com.br/whatsapp/send-text
https://api.evasend.com.br/whatsapp/send-media
```

## 📚 Documentação Completa

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Documentação completa da API
- **[CLOUDFLARE_WORKER_GUIDE.md](./CLOUDFLARE_WORKER_GUIDE.md)** - Guia de deploy e uso do Cloudflare Worker
- **[CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md)** - Configuração de variáveis de ambiente
- **[SECURITY_ANALYSIS.md](./SECURITY_ANALYSIS.md)** - Análise de segurança do sistema
- **[TROUBLESHOOTING_TOKEN_VALIDATION.md](./TROUBLESHOOTING_TOKEN_VALIDATION.md)** - Guia de troubleshooting
- **[MULTIPLE_INSTANCES_FLOW.md](./MULTIPLE_INSTANCES_FLOW.md)** - Fluxo de múltiplas instâncias
- **[RATE_LIMITING_GUIDE.md](./RATE_LIMITING_GUIDE.md)** - Documentação do rate limiting

## 🛠️ Tecnologias

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth)
- **Gateway:** Cloudflare Workers
- **API Externa:** sender.uazapi.com

## 🔐 Segurança

- ✅ Validação dinâmica de tokens
- ✅ Row Level Security (RLS)
- ✅ Rate limiting por IP e token
- ✅ Timeout de validação
- ✅ Logs otimizados (sem informações sensíveis)
- ✅ Isolamento entre instâncias

## 📊 Rate Limiting

- **Limite por IP:** 1000 requisições/minuto
- **Limite por Token:** 1000 requisições/minuto
- **Janela:** 1 minuto (deslizante)
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🚦 Status Codes

- **200** - Sucesso
- **400** - Requisição inválida
- **401** - Token inválido ou instância desconectada
- **413** - Arquivo muito grande (apenas mídia)
- **415** - Formato de mídia não suportado (apenas mídia)
- **429** - Rate limit excedido
- **500** - Erro interno do servidor
- **504** - Timeout na validação

## 📝 Exemplo Rápido

```bash
# Enviar mensagem de texto
curl -X POST https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text \
  -H "Content-Type: application/json" \
  -H "token: seu_token_aqui" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Como posso ajudar?"
  }'

# Enviar imagem
curl -X POST https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-media \
  -H "Content-Type: application/json" \
  -H "token: seu_token_aqui" \
  -d '{
    "number": "5511999999999",
    "type": "image",
    "file": "https://exemplo.com/foto.jpg",
    "text": "Veja esta foto!"
  }'
```

## 🔧 Configuração

### Variáveis de Ambiente (Cloudflare Worker)

```
SUPABASE_URL=https://ctshqbxxlauulzsbapjb.supabase.co
SUPABASE_ANON_KEY=sua_chave_aqui
DEBUG=false
RATE_LIMIT=1000
```

Veja [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md) para mais detalhes.

## 📖 Guias

- **[Como obter tokens das instâncias](./API_DOCUMENTATION.md#obtendo-tokens-das-instâncias)**
- **[Integração com n8n](./API_DOCUMENTATION.md#integração-com-n8n)**
- **[Troubleshooting](./TROUBLESHOOTING_TOKEN_VALIDATION.md)**
- **[Deploy do Cloudflare Worker](./CLOUDFLARE_WORKER_GUIDE.md)**

## 📄 Licença

Este projeto é proprietário.
