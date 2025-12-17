# Documentação da API WhatsApp Manager

## Visão Geral

Sistema de envio de mensagens WhatsApp com suporte a **múltiplas instâncias isoladas**. Cada instância possui seu próprio token único para autenticação.

### Recursos Principais

- ✅ **Múltiplas Instâncias:** Cada cliente pode ter várias instâncias WhatsApp isoladas
- ✅ **Validação Dinâmica:** Tokens validados em tempo real no banco de dados
- ✅ **Rate Limiting:** Proteção contra abuso (1000 req/min por IP/token)
- ✅ **Logs Otimizados:** Logs detalhados para debugging e monitoramento
- ✅ **Timeout Inteligente:** Validação com timeout de 10 segundos
- ✅ **Envio de Mídia:** Suporte completo para imagens, vídeos, documentos e áudios
- ✅ **Variáveis de Ambiente:** Configuração flexível via env vars

## Endpoints Disponíveis

### Opção 1: Edge Function Direta (Recomendado)
```
https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text
https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-media
```

### Opção 2: Cloudflare Worker (Domínio Customizado)
```
https://api.evasend.com.br/whatsapp/send-text
https://api.evasend.com.br/whatsapp/send-media
```

---

## POST /send-text

Envia mensagem de texto via WhatsApp usando uma instância específica.

### Headers

```
Content-Type: application/json
token: seu_instance_token
```

### Body (JSON)

```json
{
  "number": "5511999999999",
  "text": "Olá! Como posso ajudar?"
}
```

### Parâmetros

| Campo  | Tipo   | Obrigatório | Descrição                                           |
|--------|--------|-------------|-----------------------------------------------------|
| number | string | Sim         | Número com código do país (ex: 5511999999999)      |
| text   | string | Sim         | Mensagem de texto a ser enviada                     |

### Resposta de Sucesso (200)

```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "instance": {
    "id": "uuid-da-instancia",
    "name": "Nome da Instância"
  }
}
```

### Respostas de Erro

**401 Unauthorized** - Token inválido ou instância desconectada
```json
{
  "error": "Token inválido ou instância não conectada"
}
```

**400 Bad Request** - Parâmetros inválidos
```json
{
  "error": "Campos 'number' e 'text' são obrigatórios"
}
```

**500 Internal Server Error** - Erro no servidor
```json
{
  "success": false,
  "error": "Erro ao processar requisição"
}
```

---

## POST /send-media

Envia mídia (imagem, vídeo, áudio ou documento) via WhatsApp usando uma instância específica.

### Headers

```
Content-Type: application/json
token: seu_instance_token
```

### Body (JSON)

```json
{
  "number": "5511999999999",
  "type": "image",
  "file": "https://exemplo.com/foto.jpg",
  "text": "Veja esta foto!"
}
```

### Parâmetros

| Campo         | Tipo    | Obrigatório | Descrição                                                                 |
|---------------|---------|-------------|---------------------------------------------------------------------------|
| number        | string  | Sim         | Número com código do país (ex: 5511999999999)                            |
| type          | string  | Sim         | Tipo de mídia: `image`, `video`, `document`, `audio`, `myaudio`, `ptt`, `sticker` |
| file          | string  | Sim         | URL ou base64 do arquivo                                                 |
| text          | string  | Não         | Caption/legenda (aceita placeholders)                                      |
| docName       | string  | Não         | Nome do arquivo (apenas para `document`)                                  |
| replyid       | string  | Não         | ID da mensagem para responder                                            |
| mentions      | string  | Não         | Números para mencionar (separados por vírgula)                            |
| readchat      | boolean | Não         | Marca conversa como lida após envio                                      |
| readmessages  | boolean | Não         | Marca últimas mensagens recebidas como lidas                              |
| delay         | number  | Não         | Atraso em milissegundos antes do envio                                   |
| forward       | boolean | Não         | Marca a mensagem como encaminhada no WhatsApp                             |
| track_source  | string  | Não         | Origem do rastreamento da mensagem                                        |
| track_id      | string  | Não         | ID para rastreamento da mensagem                                          |

### Tipos de Mídia Suportados

- **image**: Imagens (JPG preferencialmente)
- **video**: Vídeos (apenas MP4)
- **document**: Documentos (PDF, DOCX, XLSX, etc)
- **audio**: Áudio comum (MP3 ou OGG)
- **myaudio**: Mensagem de voz (alternativa ao PTT)
- **ptt**: Mensagem de voz (Push-to-Talk)
- **sticker**: Figurinha/Sticker

### Exemplos de Requisição

#### Imagem Simples

```json
{
  "number": "5511999999999",
  "type": "image",
  "file": "https://exemplo.com/foto.jpg"
}
```

#### Documento com Nome e Caption

```json
{
  "number": "5511999999999",
  "type": "document",
  "file": "https://exemplo.com/contrato.pdf",
  "docName": "Contrato.pdf",
  "text": "Segue o documento solicitado"
}
```

#### Vídeo com Caption

```json
{
  "number": "5511999999999",
  "type": "video",
  "file": "https://exemplo.com/video.mp4",
  "text": "Confira este vídeo!"
}
```

#### Áudio de Voz (PTT)

```json
{
  "number": "5511999999999",
  "type": "ptt",
  "file": "https://exemplo.com/audio.ogg"
}
```

#### Imagem com Resposta e Menções

```json
{
  "number": "5511999999999",
  "type": "image",
  "file": "https://exemplo.com/foto.jpg",
  "text": "Olha isso! @5511999999999 @5511888888888",
  "replyid": "3EB0538DA65A59F6D8A251",
  "mentions": "5511999999999,5511888888888"
}
```

### Resposta de Sucesso (200)

```json
{
  "success": true,
  "message": "Mídia enviada com sucesso",
  "instance": {
    "id": "uuid-da-instancia",
    "name": "Nome da Instância"
  }
}
```

### Respostas de Erro

**400 Bad Request** - Parâmetros inválidos
```json
{
  "error": "Campo 'type' é obrigatório"
}
```

**401 Unauthorized** - Token inválido ou instância desconectada
```json
{
  "error": "Token inválido ou instância não conectada"
}
```

**413 Payload Too Large** - Arquivo muito grande
```json
{
  "error": "Arquivo muito grande"
}
```

**415 Unsupported Media Type** - Formato não suportado
```json
{
  "error": "Tipo de mídia 'xyz' não suportado"
}
```

**500 Internal Server Error** - Erro no servidor
```json
{
  "error": "Erro ao processar requisição de mídia"
}
```

### Exemplos de Uso

#### cURL

```bash
curl --request POST \
  --url https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-media \
  --header 'Content-Type: application/json' \
  --header 'token: seu_instance_token_aqui' \
  --data '{
    "number": "5511999999999",
    "type": "image",
    "file": "https://exemplo.com/foto.jpg",
    "text": "Veja esta foto!"
  }'
```

#### JavaScript (Fetch)

```javascript
const response = await fetch('https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-media', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'token': 'seu_instance_token_aqui'
  },
  body: JSON.stringify({
    number: '5511999999999',
    type: 'image',
    file: 'https://exemplo.com/foto.jpg',
    text: 'Veja esta foto!'
  })
});

const data = await response.json();
console.log(data);
```

#### Python (Requests)

```python
import requests

url = "https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-media"
headers = {
    "Content-Type": "application/json",
    "token": "seu_instance_token_aqui"
}
data = {
    "number": "5511999999999",
    "type": "image",
    "file": "https://exemplo.com/foto.jpg",
    "text": "Veja esta foto!"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

---

## Exemplos de Uso

### cURL

```bash
curl --request POST \
  --url https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text \
  --header 'Content-Type: application/json' \
  --header 'token: seu_instance_token_aqui' \
  --data '{
    "number": "5511999999999",
    "text": "Olá! Como posso ajudar?"
  }'
```

### JavaScript (Fetch)

```javascript
const response = await fetch('https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'token': 'seu_instance_token_aqui'
  },
  body: JSON.stringify({
    number: '5511999999999',
    text: 'Olá! Como posso ajudar?'
  })
});

const data = await response.json();
console.log(data);
```

### Python (Requests)

```python
import requests

url = "https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text"
headers = {
    "Content-Type": "application/json",
    "token": "seu_instance_token_aqui"
}
data = {
    "number": "5511999999999",
    "text": "Olá! Como posso ajudar?"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### PHP

```php
<?php
$url = 'https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text';
$data = [
    'number' => '5511999999999',
    'text' => 'Olá! Como posso ajudar?'
];

$options = [
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'token: seu_instance_token_aqui'
        ],
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);
echo $response;
?>
```

---

## Integração com n8n

### Configuração no n8n

1. **Adicionar nó HTTP Request**
2. **Configurar Method:** POST
3. **Configurar URL:** `https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text`
4. **Adicionar Authentication:**
   - Type: `Header Auth`
   - Name: `token`
   - Value: `[seu_instance_token]`
5. **Configurar Body:**
   - Body Content Type: `JSON`
   - Body:
     ```json
     {
       "number": "{{$json.phone}}",
       "text": "{{$json.message}}"
     }
     ```

### Múltiplas Instâncias no n8n

Crie **múltiplas credenciais**, uma para cada instância:

- **WhatsApp Vendas**
  - Name: `token`
  - Value: `abc123def456...` (token da instância Vendas)

- **WhatsApp Suporte**
  - Name: `token`
  - Value: `ghi789jkl012...` (token da instância Suporte)

- **WhatsApp Marketing**
  - Name: `token`
  - Value: `mno345pqr678...` (token da instância Marketing)

Cada workflow pode selecionar qual credencial (instância) usar.

### Exemplo de Workflow n8n

```
Webhook → Set Variables → HTTP Request (WhatsApp) → Response
```

**Set Variables:**
```json
{
  "phone": "{{$json.body.phone}}",
  "message": "Olá {{$json.body.name}}, sua mensagem foi recebida!"
}
```

**HTTP Request:**
- URL: `https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text`
- Authentication: `WhatsApp Vendas` (selecione a credencial desejada)
- Body:
```json
{
  "number": "{{$json.phone}}",
  "text": "{{$json.message}}"
}
```

---

## Múltiplas Instâncias

### Como Funciona

Cada instância WhatsApp possui:
- ✅ Token único (`instance_token`)
- ✅ Isolamento automático no banco de dados
- ✅ Validação em cada requisição
- ✅ Status independente (conectada/desconectada)

### Exemplo com Múltiplas Instâncias

```bash
# Enviar via instância "Vendas"
curl -X POST https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text \
  -H "token: abc123def456..." \
  -d '{"number":"5511999999999","text":"Mensagem da equipe de Vendas"}'

# Enviar via instância "Suporte"
curl -X POST https://ctshqbxxlauulzsbapjb.supabase.co/functions/v1/send-text \
  -H "token: ghi789jkl012..." \
  -d '{"number":"5511999999999","text":"Mensagem da equipe de Suporte"}'
```

### Obtendo Tokens das Instâncias

1. Acesse o painel do cliente
2. Vá em "Instâncias"
3. Conecte uma instância WhatsApp (QR Code)
4. Após conectada, acesse a aba "API"
5. Copie o `instance_token` da instância desejada

---

## Segurança

### Validação Automática

Cada requisição valida:
- ✅ Token existe no banco de dados?
- ✅ Instância está com status "conectada"?
- ✅ Token pertence a um usuário válido? (via RLS)

### Isolamento

- ❌ Token de uma instância **não funciona** em outra
- ❌ Token inválido retorna erro 401
- ❌ Instância desconectada retorna erro 401
- ✅ Row Level Security (RLS) garante isolamento

### Boas Práticas

1. **Nunca exponha tokens publicamente**
2. **Use HTTPS sempre**
3. **Rotacione tokens se comprometidos** (reconecte a instância)
4. **Monitore logs de acesso** (disponível no Supabase)
5. **Use uma instância por departamento/aplicação**

---

## Troubleshooting

### Erro 401 "Unauthorized"

**Possíveis causas:**
- Token inválido ou copiado incorretamente
- Instância desconectada
- Token de outra instância

**Soluções:**
1. Verifique se copiou o token correto da aba "API"
2. Certifique-se que a instância está "Conectada" (status verde)
3. Teste o token no painel (aba "API" → "Testar API")
4. Reconecte a instância se necessário

### Erro 400 "Bad Request"

**Possíveis causas:**
- Campos obrigatórios ausentes (`number` ou `text`)
- Formato JSON inválido
- Número de telefone inválido

**Soluções:**
1. Verifique se enviou `number` e `text` no body
2. Valide o JSON usando um validador online
3. Certifique-se que o número está no formato correto: `5511999999999`

### Erro 500 "Internal Server Error"

**Possíveis causas:**
- Erro no servidor WhatsApp externo
- Edge Function com problema
- Timeout na requisição

**Soluções:**
1. Verifique logs no painel do Supabase
2. Tente novamente após alguns segundos
3. Verifique se a instância continua conectada
4. Entre em contato com o suporte se persistir

---

## Limites e Quotas

### Rate Limiting

O sistema implementa **rate limiting** para proteger contra abuso:

- **Limite por IP:** 1000 requisições/minuto
- **Limite por Token:** 1000 requisições/minuto
- **Janela de Tempo:** 1 minuto (deslizante)
- **Aplicado em:** Cloudflare Worker (domínio customizado)

#### Headers de Rate Limit

Todas as respostas incluem headers informativos:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1733520000000
```

#### Resposta de Rate Limit Excedido (429)

```json
{
  "error": "Rate limit exceeded for IP. Limit: 1000 req/min",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 1000,
  "remaining": 0,
  "reset": "2024-12-06T20:00:00.000Z"
}
```

Headers adicionais:
```
Retry-After: 45
```

### Timeouts

- **Validação de Token:** 10 segundos (timeout automático)
- **Requisição HTTP:** 30 segundos
- **Edge Function:** 60 segundos

### Tamanho

- **Texto máximo:** 4096 caracteres
- **Body máximo:** 1 MB
- **Arquivos de mídia:** Conforme limites da API externa

---

## Logs e Monitoramento

### Cloudflare Worker

O Worker gera logs detalhados para debugging:

- **Logs de Validação:** `[INFO] Starting token validation`, `[INFO] Token validation completed`
- **Logs de Erro:** `[ERROR] Token validation timeout`, `[ERROR] Database query failed`
- **Logs de Aviso:** `[WARN] Request rejected - Invalid token`, `[WARN] Instance not connected`

**Acessar logs:**
1. Cloudflare Dashboard → Workers & Pages
2. Selecione seu Worker
3. Aba "Logs"

### Variável de Ambiente DEBUG

Configure `DEBUG=true` no Cloudflare Worker para logs mais detalhados:
- Stack traces completos
- URLs e tokens parciais
- Informações detalhadas de validação

**Produção:** Use `DEBUG=false` (padrão)

### Headers de Resposta

Todas as respostas incluem headers informativos:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1733520000000
```

---

## Suporte

### Documentação
- Painel do Cliente: Aba "API"
- Logs: Painel Supabase → Edge Functions
- Logs Worker: Cloudflare Dashboard → Workers → Logs

### Contato
- Para dúvidas sobre integração, consulte esta documentação
- Para problemas técnicos, verifique os logs primeiro
- Para novos recursos, entre em contato com o administrador

### Troubleshooting

Consulte [TROUBLESHOOTING_TOKEN_VALIDATION.md](./TROUBLESHOOTING_TOKEN_VALIDATION.md) para problemas comuns e soluções.
