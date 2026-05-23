import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const MASTER_INSTRUCTIONS = `
# SALES ASSISTANT MASTER CODE OF CONDUCT
You are a highly trained Sales Concierge. Your goal is NOT JUST to answer questions, but to GENTLY GUIDE the customer toward a purchase and funnel them to a checkout or human connection.

## OPERATIONAL GUIDELINES:
1. **Persona**: Be professional, warm, and highly conversational but extremely concise. Act human.
2. **Consultative Selling**: 
   - Keep your text 'reply' extremely brief and engaging (maximum 1 to 2 short sentences). 
   - NEVER list prices or long descriptions in the 'reply' text.
   - Let the mini product cards do the heavy lifting of showing product details, pricing, and add-to-cart.
3. **Upselling**: 
   - Suggest relevant variations or complementary items.
4. **ROGUE PREVENTION (CRITICAL)**: 
   - NEVER promise, offer, or confirm availability of an item that is NOT explicitly listed in the provided catalog.
   - If they need something we don't have, politely inform them we don't carry it.
5. **LOOP PREVENTION & HUMAN ESCALATION**:
   - If the user is asking the same question repeatedly, going around in circles, shows frustration, or explicitly requests human assistance, you must set "whatsapp_handoff": true in the output JSON.

## OUTPUT FORMAT
You MUST respond in valid JSON format ONLY. Do not wrap it in markdown block quotes or markdown blocks.
{
  "reply": "Your brief conversational response (max 2 sentences) here.",
  "recommended_product_ids": ["uuid-of-product-1", "uuid-of-product-2"],
  "whatsapp_handoff": true or false
}
If you are not recommending any specific products, leave the recommended_product_ids array empty []. Set whatsapp_handoff to false unless escalation is required.
`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { messages, shopId, menuItems, brainOverride } = await req.json()

    // 1. Fetch Shop Brain & Credits
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('name, sales_brain, ai_credits')
      .eq('shop_id', shopId)
      .single()

    if (shopError || !shop) throw new Error("Shop not found or AI inactive")
    if (shop.ai_credits <= 0) throw new Error("Shop out of AI credits")

    const brain = brainOverride || shop.sales_brain || {}
    const personality = brain.personality || "Professional Sales Assistant"
    const playbook = brain.sales_playbook || "Focus on being helpful and driving sales."
    const tone = brain.tone || "balanced and professional"

    // 2. Context Pruner: Filter catalog size dynamically to avoid token blowout
    const lastUserQuery = messages && messages.length > 0 ? messages[messages.length - 1].content.toLowerCase() : "";
    const isGreeting = ["hey", "hello", "hi", "greetings", "yo", "sup"].some(w => lastUserQuery === w || lastUserQuery.startsWith(w + " "));

    let filteredItems = menuItems;
    if (isGreeting) {
      // For basic greetings, only serialize first 8 popular items to conserve tokens
      filteredItems = menuItems.slice(0, 8);
    } else if (lastUserQuery.length > 2) {
      // Filter catalog to matching keywords, category name or fallback backups
      const keywords = lastUserQuery.split(/\s+/).filter((w: string) => w.length > 2);
      const matches = menuItems.filter((item: any) => 
        keywords.some((kw: string) => 
          item.name?.toLowerCase().includes(kw) || 
          item.category?.toLowerCase().includes(kw) || 
          item.description?.toLowerCase().includes(kw)
        )
      );
      // Keep matches, but append up to 6 popular items as fallback recommendations
      const backups = menuItems.filter((item: any) => !matches.some((m: any) => m.id === item.id)).slice(0, 6);
      filteredItems = [...matches, ...backups].slice(0, 12);
    } else {
      filteredItems = menuItems.slice(0, 10);
    }

    const catalogSnippet = filteredItems.map((item: any) => 
      `- ID: ${item.id} | Name: ${item.name} | Price: KSh ${item.price} | Category: ${item.category}\n  Desc: ${item.description || 'Premium quality'}\n  Diet/Tags: ${item.diet_tags && Array.isArray(item.diet_tags) ? item.diet_tags.join(', ') : 'None'}\n  Benefits: ${item.benefits || 'N/A'}`
    ).join('\n\n');

    const fullSystemPrompt = `
${MASTER_INSTRUCTIONS}

SHOP NAME: ${shop.name}
YOUR PERSONA: ${personality}
YOUR TONE: ${tone}
YOUR SPECIFIC PLAYBOOK: ${playbook}

AVAILABLE CATALOG (FILTERED RELEVANCY STATE):
${catalogSnippet}
`;

    // 3. Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const aiResponseRaw = data.choices[0].message.content
    
    let aiResponseParsed;
    try {
      aiResponseParsed = JSON.parse(aiResponseRaw);
    } catch (e) {
      aiResponseParsed = { reply: aiResponseRaw, recommended_product_ids: [], whatsapp_handoff: false };
    }

    // 4. Atomic Credit Deduction & Log Insertion inside transactional block
    try {
      await supabase.rpc('decrement_ai_credits', { sh_id: shopId })
      
      const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : "Catalog inquiry";
      await supabase.from('ai_usage_logs').insert({
        shop_id: shopId,
        user_query: lastMsg,
        ai_response: aiResponseParsed.reply || "",
        tokens_consumed: data.usage?.total_tokens || 0,
        credits_deducted: 1
      });
    } catch (dbErr) {
      console.error("Credit deduction / log write error:", dbErr);
    }

    return new Response(JSON.stringify(aiResponseParsed), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes("Shop out") || error.message.includes("Insufficient") ? 402 : 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
