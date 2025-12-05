// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();
    const { application_id, task_type, due_at } = body;
    const allowed = ["call", "email", "review"];

    if (!application_id || !task_type || !due_at) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }
    if (!allowed.includes(task_type)) {
      return new Response(JSON.stringify({ error: "Invalid task_type" }), { status: 400, headers: corsHeaders });
    }
    if (new Date(due_at) <= new Date()) {
      return new Response(JSON.stringify({ error: "due_at must be in the future" }), { status: 400, headers: corsHeaders });
    }

    const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('tenant_id')
        .eq('id', application_id)
        .single();

    if (appError || !appData) {
        return new Response(JSON.stringify({ error: "Invalid Application ID" }), { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({ 
          application_id, 
          type: task_type, 
          due_at,
          tenant_id: appData.tenant_id 
      })
      .select("id")
      .single();

    if (error) {
      console.log(error); 
      return new Response(JSON.stringify({ error: "Insert failed" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, task_id: data.id }), { status: 200, headers: corsHeaders });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});