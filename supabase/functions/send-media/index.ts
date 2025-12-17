import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, token, X-Client-Info",
};

interface SendMediaRequest {
  number: string;
  type: "image" | "video" | "document" | "audio" | "myaudio" | "ptt" | "sticker";
  file: string; // URL ou base64
  text?: string; // Caption/legenda
  docName?: string; // Nome do arquivo (apenas para documents)
  replyid?: string;
  mentions?: string;
  readchat?: boolean;
  readmessages?: boolean;
  delay?: number;
  forward?: boolean;
  track_source?: string;
  track_id?: string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const token = req.headers.get("token");
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token é obrigatório no header" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body: SendMediaRequest = await req.json();

    // Validação de campos obrigatórios
    if (!body.number) {
      return new Response(
        JSON.stringify({ error: "Campo 'number' é obrigatório" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!body.type) {
      return new Response(
        JSON.stringify({ error: "Campo 'type' é obrigatório" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validação de tipos de mídia suportados
    const supportedTypes = ["image", "video", "document", "audio", "myaudio", "ptt", "sticker"];
    if (!supportedTypes.includes(body.type)) {
      return new Response(
        JSON.stringify({ 
          error: `Tipo de mídia '${body.type}' não suportado. Tipos suportados: ${supportedTypes.join(", ")}` 
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!body.file) {
      return new Response(
        JSON.stringify({ error: "Campo 'file' é obrigatório (URL ou base64)" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Faz proxy para a API externa
    const response = await fetch("https://sender.uazapi.com/send/media", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "token": token,
      },
      body: JSON.stringify({
        number: body.number,
        type: body.type,
        file: body.file,
        ...(body.text && { text: body.text }),
        ...(body.docName && { docName: body.docName }),
        ...(body.replyid && { replyid: body.replyid }),
        ...(body.mentions && { mentions: body.mentions }),
        ...(body.readchat !== undefined && { readchat: body.readchat }),
        ...(body.readmessages !== undefined && { readmessages: body.readmessages }),
        ...(body.delay !== undefined && { delay: body.delay }),
        ...(body.forward !== undefined && { forward: body.forward }),
        ...(body.track_source && { track_source: body.track_source }),
        ...(body.track_id && { track_id: body.track_id }),
      }),
    });

    const responseData = await response.json();

    return new Response(
      JSON.stringify(responseData),
      {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao processar requisição de mídia",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

