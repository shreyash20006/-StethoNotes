import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { messageId, replyBody } = await req.json()
    if (!messageId || !replyBody?.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'messageId and replyBody required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) throw new Error('Invalid session')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    const { data: contactMsg, error: msgErr } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', messageId)
      .single()
    if (msgErr || !contactMsg) throw new Error('Message not found')

    const brevoKey = Deno.env.get('BREVO_API_KEY') ?? ''
    let emailStatus: 'delivered' | 'failed' = 'failed'

    if (brevoKey) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'StethoNotes Support', email: 'support@stethonotes.store' },
          to: [{ email: contactMsg.email, name: contactMsg.name }],
          subject: `Re: ${contactMsg.subject}`,
          htmlContent: `
            <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
              <p style="color:#64748b;">Hi <strong>${contactMsg.name}</strong>,</p>
              <div style="background:#f8fafc;padding:20px;border-radius:12px;margin:16px 0;border-left:4px solid #1FB6D4;">
                <p style="color:#334155;white-space:pre-wrap;line-height:1.6;">${replyBody}</p>
              </div>
              <p style="color:#94a3b8;font-size:12px;">— StethoNotes Support Team</p>
            </div>
          `,
        }),
      })
      emailStatus = res.ok ? 'delivered' : 'failed'
    }

    const { data: reply, error: replyErr } = await supabase
      .from('contact_message_replies')
      .insert({
        message_id: messageId,
        admin_id: user.id,
        reply_body: replyBody.trim(),
        email_status: emailStatus,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (replyErr) throw replyErr

    await supabase
      .from('contact_messages')
      .update({ status: 'replied' })
      .eq('id', messageId)

    return new Response(JSON.stringify({ success: true, reply, emailStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
