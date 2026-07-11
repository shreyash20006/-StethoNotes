import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to verify HMAC SHA256 signature using Web Crypto API
async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(data)

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    messageData
  )

  const hashArray = Array.from(new Uint8Array(signatureBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  return hashHex === signature
}

// Helper to generate fresh 48-hour signed URLs & send Brevo email
async function generateAndSendEmail(
  supabaseAdmin: any,
  order: any,
  items: any[],
  brevoApiKey: string,
  brevoTemplateId: string | undefined,
  fromEmail: string,
  fromName: string
) {
  const emailNotesList: Array<{ title: string; subject: string; downloadUrl: string }> = []
  
  for (const item of items) {
    if (item.note) {
      // 48 hours = 172800 seconds
      const { data, error } = await supabaseAdmin.storage
        .from('notes-pdfs')
        .createSignedUrl(item.note.pdf_url, 172800)

      if (error || !data?.signedUrl) {
        console.error(`Error generating signed URL for note ${item.note.id}:`, error)
        throw new Error(`Could not generate download link for ${item.note.title}`)
      }

      emailNotesList.push({
        title: item.note.title,
        subject: item.note.subject,
        downloadUrl: data.signedUrl
      })
    }
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
            If you have any issues downloading your notes or require academic assistance, please reply to this email or contact us at <a href="mailto:${fromEmail}" style="color:#1FB6D4">${fromEmail}</a>.
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

  // Update order status in DB to "sent"
  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ email_status: 'sent' })
    .eq('id', order.id)

  if (updateErr) throw updateErr

  // Log success
  await supabaseAdmin.from('email_logs').insert({
    order_id: order.id,
    email: order.customer_email,
    status: 'success'
  })
}

serve(async (req) => {
  // CORS options preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace(/\/$/, "")

  // Supabase keys
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Razorpay keys
  const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') ?? ""
  const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ""
  const razorpayWebhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ""

  // Brevo keys
  const brevoApiKey = Deno.env.get('BREVO_API_KEY') ?? ""
  const brevoTemplateId = Deno.env.get('BREVO_TEMPLATE_ID')
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'noreply@stethonotes.store'
  const fromName = Deno.env.get('FROM_NAME') ?? 'StethoNotes'

  try {
    // --------------------------------------------------------
    // ENDPOINT: /create-order
    // --------------------------------------------------------
    if (path.endsWith('/create-order')) {
      const { items, userId, name, email, phone } = await req.json()

      if (!items || items.length === 0 || !email) {
        return new Response(JSON.stringify({ success: false, message: 'Missing fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch note details from DB to calculate actual price (never trust frontend input)
      const noteIds = items.map((i: any) => i.id)
      const { data: dbNotes, error: notesErr } = await supabaseAdmin
        .from('notes')
        .select('id, price')
        .in('id', noteIds)

      if (notesErr || !dbNotes || dbNotes.length === 0) {
        throw new Error('Notes not found or database query failed.')
      }

      const totalAmount = dbNotes.reduce((sum: number, note: any) => sum + Number(note.price), 0)

      if (totalAmount <= 0) {
        throw new Error('Total checkout amount must be greater than zero.')
      }

      // Create Razorpay Order
      const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      const razorpayOrderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // convert to paise
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            note_ids: noteIds.join(","),
            user_id: userId || "",
            customer_name: name,
            customer_email: email.toLowerCase(),
            customer_phone: phone
          }
        })
      })

      if (!razorpayOrderRes.ok) {
        const errText = await razorpayOrderRes.text()
        throw new Error(`Razorpay Order creation failed: ${errText}`)
      }

      const razorpayOrder = await razorpayOrderRes.json()

      return new Response(JSON.stringify({
        success: true,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --------------------------------------------------------
    // ENDPOINT: /verify-payment
    // --------------------------------------------------------
    else if (path.endsWith('/verify-payment')) {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        note_ids,
        user_id,
        customer_name,
        customer_email,
        customer_phone
      } = await req.json()

      // Signature Verification
      const dataToVerify = `${razorpay_order_id}|${razorpay_payment_id}`
      const isVerified = await verifyHmacSignature(dataToVerify, razorpay_signature, razorpayKeySecret)

      if (!isVerified) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid payment signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check if order already exists (webhook could have created it first)
      let { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('razorpay_payment_id', razorpay_payment_id)
        .maybeSingle()

      let dbOrder = existingOrder

      if (!dbOrder) {
        // Fetch note objects to calculate total amount & insert items
        const { data: dbNotes } = await supabaseAdmin
          .from('notes')
          .select('*')
          .in('id', note_ids)

        if (!dbNotes || dbNotes.length === 0) {
          throw new Error('Notes not found in catalog database.')
        }

        const totalAmount = dbNotes.reduce((sum: number, n: any) => sum + Number(n.price), 0)

        // Insert database order record
        const { data: newOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            user_id: user_id || null,
            customer_name,
            customer_email: customer_email.toLowerCase(),
            customer_phone,
            total_amount: totalAmount,
            razorpay_payment_id,
            payment_status: 'completed',
            email_status: 'pending'
          })
          .select()
          .single()

        if (orderErr || !newOrder) throw orderErr
        dbOrder = newOrder

        // Insert order items
        const orderItemsPayload = dbNotes.map((note: any) => ({
          order_id: dbOrder.id,
          note_id: note.id,
          price: note.price
        }))

        const { error: itemsErr } = await supabaseAdmin
          .from('order_items')
          .insert(orderItemsPayload)

        if (itemsErr) throw itemsErr
      }

      // Fetch notes list with content to generate signed download URLs
      const { data: orderItemsData } = await supabaseAdmin
        .from('order_items')
        .select('*, note:notes(*)')
        .eq('order_id', dbOrder.id)

      // Send Email via Brevo
      try {
        await generateAndSendEmail(
          supabaseAdmin,
          dbOrder,
          orderItemsData || [],
          brevoApiKey,
          brevoTemplateId,
          fromEmail,
          fromName
        )
      } catch (emailErr: any) {
        console.error('Email sending failed:', emailErr)
        await supabaseAdmin
          .from('orders')
          .update({ email_status: 'failed' })
          .eq('id', dbOrder.id)

        await supabaseAdmin.from('email_logs').insert({
          order_id: dbOrder.id,
          email: dbOrder.customer_email,
          status: 'failure',
          error_message: emailErr.message
        })
      }

      return new Response(JSON.stringify({ success: true, order_id: dbOrder.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --------------------------------------------------------
    // ENDPOINT: /webhook
    // --------------------------------------------------------
    else if (path.endsWith('/webhook')) {
      const webhookBody = await req.text()
      const signature = req.headers.get('x-razorpay-signature') ?? ""

      const isVerified = await verifyHmacSignature(webhookBody, signature, razorpayWebhookSecret)
      if (!isVerified) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid webhook signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const payload = JSON.parse(webhookBody)
      const event = payload.event

      if (event === 'order.paid' || event === 'payment.captured') {
        const payment = payload.payload.payment.entity
        const razorpay_payment_id = payment.id
        const razorpay_order_id = payment.order_id

        // Fetch Razorpay Order notes metadata
        const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
        const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
          headers: { "Authorization": `Basic ${auth}` }
        })

        if (!orderRes.ok) {
          throw new Error(`Webhook order lookup failed: ${await orderRes.text()}`)
        }

        const razorpayOrderObj = await orderRes.json()
        const meta = razorpayOrderObj.notes || {}
        const note_ids = (meta.note_ids || "").split(",").filter(Boolean)

        if (note_ids.length > 0) {
          // Check if order already exists in database
          let { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('razorpay_payment_id', razorpay_payment_id)
            .maybeSingle()

          let dbOrder = existingOrder

          if (!dbOrder) {
            const { data: dbNotes } = await supabaseAdmin
              .from('notes')
              .select('*')
              .in('id', note_ids)

            if (dbNotes && dbNotes.length > 0) {
              const totalAmount = dbNotes.reduce((sum: number, n: any) => sum + Number(n.price), 0)

              // Insert order record
              const { data: newOrder } = await supabaseAdmin
                .from('orders')
                .insert({
                  user_id: meta.user_id ? meta.user_id : null,
                  customer_name: meta.customer_name || 'Customer',
                  customer_email: (meta.customer_email || 'support@stethonotes.com').toLowerCase(),
                  customer_phone: meta.customer_phone || '',
                  total_amount: totalAmount,
                  razorpay_payment_id,
                  payment_status: 'completed',
                  email_status: 'pending'
                })
                .select()
                .single()

              dbOrder = newOrder

              if (dbOrder) {
                // Insert order items
                const orderItemsPayload = dbNotes.map((note: any) => ({
                  order_id: dbOrder.id,
                  note_id: note.id,
                  price: note.price
                }))

                await supabaseAdmin
                  .from('order_items')
                  .insert(orderItemsPayload)
              }
            }
          }

          if (dbOrder && dbOrder.email_status !== 'sent') {
            const { data: orderItemsData } = await supabaseAdmin
              .from('order_items')
              .select('*, note:notes(*)')
              .eq('order_id', dbOrder.id)

            // Trigger Brevo Email Send
            try {
              await generateAndSendEmail(
                supabaseAdmin,
                dbOrder,
                orderItemsData || [],
                brevoApiKey,
                brevoTemplateId,
                fromEmail,
                fromName
              )
            } catch (emailErr: any) {
              console.error('Webhook Email sending failed:', emailErr)
              await supabaseAdmin
                .from('orders')
                .update({ email_status: 'failed' })
                .eq('id', dbOrder.id)

              await supabaseAdmin.from('email_logs').insert({
                order_id: dbOrder.id,
                email: dbOrder.customer_email,
                status: 'failure',
                error_message: emailErr.message
              })
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: false, message: 'Invalid endpoint route' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error("Payment Service Error:", err)
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
