// Follow Deno imports for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let orderId: string | null = null;
  let customerEmail: string = '';
  let supabase: any = null;

  try {
    const body = await req.json()
    orderId = body.orderId

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing orderId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase Client with Admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase Service configurations in Deno environment.')
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch order details
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      throw new Error(`Order ${orderId} not found.`)
    }

    customerEmail = order.customer_email || '';

    // 2. Fetch order items
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('*, note:notes(*)')
      .eq('order_id', orderId)

    if (itemsErr || !items || items.length === 0) {
      throw new Error(`No items found for order ${orderId}.`)
    }

    // 3. Generate 48-hour secure signed download URLs for each purchased note PDF
    const emailNotesList: Array<{ title: string; subject: string; downloadUrl: string }> = []
    
    for (const item of items) {
      if (item.note) {
        // Generate signed URL valid for 48 hours (172800 seconds)
        const { data, error } = await supabase.storage
          .from('notes-pdfs')
          .createSignedUrl(item.note.pdf_url, 172800)

        if (error || !data?.signedUrl) {
          console.error(`Error generating signed URL for note ${item.note.id}:`, error)
          throw new Error(`Could not generate download key for ${item.note.title}`)
        }

        emailNotesList.push({
          title: item.note.title,
          subject: item.note.subject,
          downloadUrl: data.signedUrl
        })
      }
    }

    // 4. Config variables
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const brevoTemplateId = Deno.env.get('BREVO_TEMPLATE_ID')
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'noreply@stethonotes.store'
    const fromName = Deno.env.get('FROM_NAME') ?? 'StethoNotes'

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not configured.')
    }

    // Build notes HTML list for fallback email
    const notesHtml = emailNotesList.map(item => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #E6F7FA; border-left: 4px solid #1FB6D4; background-color: #FAFCFD; border-radius: 8px;">
        <span style="font-size: 10px; text-transform: uppercase; color: #1FB6D4; font-weight: bold; font-family: sans-serif;">${item.subject}</span>
        <h4 style="margin: 5px 0; color: #0F2D6B; font-family: Arial, sans-serif; font-size: 16px;">${item.title}</h4>
        <p style="margin: 10px 0 0 0;">
          <a href="${item.downloadUrl}" target="_blank" style="display: inline-block; background-color: #1FB6D4; color: #ffffff; padding: 8px 18px; font-family: sans-serif; font-size: 12px; font-weight: bold; text-decoration: none; border-radius: 6px;">Download PDF Study Notes</a>
        </p>
        <span style="font-size: 10px; color: #888888; font-family: sans-serif; display: block; margin-top: 6px;">* Download link will remain active for 48 hours.</span>
      </div>
    `).join('')

    const emailHtmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #0F2D6B; background-color: #FAFCFD; padding: 20px; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #EAF0F6; box-shadow: 0 4px 12px rgba(15,45,107,0.05);">
            <h2 style="font-family: Arial, sans-serif; color: #0F2D6B; border-bottom: 1px solid #EAF0F6; padding-bottom: 15px; text-align: center;">Stetho<span style="color:#1FB6D4">Notes</span> Delivery</h2>
            <p>Dear <strong>${order.customer_name}</strong>,</p>
            <p>Thank you for purchasing study materials from StethoNotes! Your payment has been verified, and your digital note PDFs are ready for download below.</p>
            
            <div style="margin: 25px 0;">
              ${notesHtml}
            </div>

            <p style="font-size: 13px; color: #666666;">
              If you have any issues downloading your notes or require academic assistance, please reply to this email or contact us at <a href="mailto:support@stethonotes.store" style="color:#1FB6D4">support@stethonotes.store</a>.
            </p>
            <div style="border-top: 1px solid #EAF0F6; padding-top: 15px; margin-top: 30px; text-align: center; font-size: 11px; color: #888888;">
              <p>StethoNotes © 2026. Your Stethoscope to success.</p>
            </div>
          </div>
        </body>
      </html>
    `

    let brevoPayload: any = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: order.customer_email, name: order.customer_name }],
      subject: "📚 Your StethoNotes Order is Ready!"
    }

    if (brevoTemplateId) {
      brevoPayload = {
        ...brevoPayload,
        templateId: parseInt(brevoTemplateId, 10),
        params: {
          CUSTOMER_NAME: order.customer_name,
          ORDER_ID: order.id,
          TOTAL_AMOUNT: order.total_amount,
          ITEMS: emailNotesList.map(item => ({
            title: item.title,
            subject: item.subject,
            downloadUrl: item.downloadUrl
          })),
          DOWNLOADS_HTML: notesHtml
        }
      }
    } else {
      brevoPayload = {
        ...brevoPayload,
        htmlContent: emailHtmlBody
      }
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(brevoPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Brevo SMTP dispatch failed: ${errorText}`)
    }

    // 5. Update order status in DB to "sent"
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ email_status: 'sent' })
      .eq('id', orderId)

    if (updateErr) throw updateErr

    // Log success
    await supabase.from('email_logs').insert({
      order_id: orderId,
      email: customerEmail,
      status: 'success'
    })

    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully via Brevo.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error("Edge Function Error:", err)

    // Attempt to log failure in database if orderId is available
    if (supabase && orderId) {
      try {
        await supabase
          .from('orders')
          .update({ email_status: 'failed' })
          .eq('id', orderId)

        await supabase.from('email_logs').insert({
          order_id: orderId,
          email: customerEmail || 'unknown@stethonotes.com',
          status: 'failure',
          error_message: err.message
        })
      } catch (logErr) {
        console.error("Failed to write to logs or update order status:", logErr)
      }
    }
    
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
