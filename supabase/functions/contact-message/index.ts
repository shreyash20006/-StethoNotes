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
    const { name, email, subject, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'All fields are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: saved, error: dbErr } = await supabase
      .from('contact_messages')
      .insert({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim(), status: 'unread' })
      .select()
      .single()

    if (dbErr) throw dbErr

    // Notify admin via Brevo
    const brevoKey = Deno.env.get('BREVO_API_KEY') ?? ''
    const adminEmail = Deno.env.get('ADMIN_EMAIL') ?? 'support@stethonotes.store'

    if (brevoKey) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'StethoNotes Contact', email: 'noreply@stethonotes.store' },
          to: [{ email: adminEmail, name: 'StethoNotes Admin' }],
          subject: `[Contact] ${subject}`,
          htmlContent: `
            <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
              <h2 style="color:#0f172a;">New Contact Message</h2>
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <div style="background:#f8fafc;padding:16px;border-radius:12px;margin-top:16px;">
                <p style="color:#334155;white-space:pre-wrap;">${message}</p>
              </div>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Reply from the admin panel at stethonotes.store/admin</p>
            </div>
          `,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true, id: saved.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
