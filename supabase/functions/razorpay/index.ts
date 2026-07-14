import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"



interface DebugLog {
  stage: string
  message: string
  details?: any
  stack?: string
}

function logDebug(entry: DebugLog) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    stage: entry.stage,
    message: entry.message,
    details: entry.details,
    stack: entry.stack
  }))
}

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    "https://www.stethonotes.store",
    "https://stethonotes.store",
    "http://localhost:5173",
    "http://localhost:3000",
  ]
  const resolvedOrigin = origin && allowedOrigins.includes(origin) ? origin : "https://www.stethonotes.store"
  return {
    "Access-Control-Allow-Origin": resolvedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-action",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  }
}

function getRelativeStoragePath(urlOrPath: string): string {
  if (!urlOrPath) return "";
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    const marker = "notes-pdfs/";
    const index = urlOrPath.indexOf(marker);
    if (index !== -1) {
      return decodeURIComponent(urlOrPath.substring(index + marker.length));
    }
    try {
      const parsed = new URL(urlOrPath);
      const segments = parsed.pathname.split("/");
      const bucketIdx = segments.indexOf("notes-pdfs");
      if (bucketIdx !== -1 && bucketIdx < segments.length - 1) {
        return decodeURIComponent(segments.slice(bucketIdx + 1).join("/"));
      }
    } catch (_) {}
  }
  return urlOrPath;
}

function createErrorResponse(stage: string, message: string, details?: any, stack?: string) {
  return {
    success: false,
    stage,
    message,
    details,
    stack
  }
}

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
  
  if (hashHex.length !== signature.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < hashHex.length; i++) {
    result |= hashHex.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return result === 0
}

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
  
  logDebug({
    stage: "generate_and_send_email",
    message: "Starting email generation for order",
    details: { orderId: order.id, itemCount: items.length }
  })
  
  for (const item of items) {
    if (item.note) {
      const relativePath = getRelativeStoragePath(item.note.pdf_url)
      
      // Task 3: Verify the PDF exists in the private Storage bucket.
      const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/'))
      const fileName = relativePath.substring(relativePath.lastIndexOf('/') + 1)
      
      console.log(`Verifying file existence in notes-pdfs storage: ${relativePath}`);
      const { data: fileList, error: listError } = await supabaseAdmin.storage
        .from('notes-pdfs')
        .list(folderPath || undefined, {
          search: fileName
        })
      
      const fileExists = fileList?.some((f: any) => f.name === fileName)
      if (!fileExists || listError) {
        console.error(`Storage file verification failed: File ${relativePath} does not exist in bucket 'notes-pdfs'.`, listError);
        throw new Error(`PDF file does not exist in private storage bucket: ${relativePath}`);
      }
      console.log(`Verified: File ${relativePath} exists in private storage bucket 'notes-pdfs'.`);

      // Task 4 & 5: Verify createSignedUrl() succeeds and log it.
      const { data, error } = await supabaseAdmin.storage
        .from('notes-pdfs')
        .createSignedUrl(relativePath, 172800)

      if (error || !data?.signedUrl) {
        logDebug({
          stage: "generate_and_send_email",
          message: "Failed to create signed URL",
          details: { noteId: item.note.id, error }
        })
        throw new Error(`Could not generate download link for ${item.note.title}`)
      }

      console.log(`Signed URL generated successfully: ${data.signedUrl}`);

      emailNotesList.push({
        title: item.note.title,
        subject: item.note.subject,
        downloadUrl: data.signedUrl
      })
    }
  }

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

  if (brevoTemplateId && !isNaN(Number(brevoTemplateId))) {
    const downloadListHtml = `
      <ul style="padding-left: 20px; margin: 0; font-family: sans-serif; font-size: 14px; line-height: 1.6;">
        ${emailNotesList.map(item => `
          <li style="margin-bottom: 12px;">
            <strong>${item.title}</strong> (${item.subject})<br/>
            <a href="${item.downloadUrl}" target="_blank" style="color: #1FB6D4; text-decoration: underline; font-weight: bold;">Download Notes</a>
          </li>
        `).join('')}
      </ul>
    `
    brevoPayload = {
      ...brevoPayload,
      templateId: parseInt(brevoTemplateId, 10),
      params: {
        customer_name: order.customer_name,
        order_id: order.id,
        order_date: new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        download_list: downloadListHtml,
        CUSTOMER_NAME: order.customer_name,
        ORDER_ID: order.id,
        TOTAL_AMOUNT: order.total_amount,
        ITEMS: emailNotesList.map(item => ({
          title: item.title,
          subject: item.subject,
          downloadUrl: item.downloadUrl
        })),
        DOWNLOADS_HTML: notesHtml,
        // Transactional template variables (Task 9)
        download_link: emailNotesList[0]?.downloadUrl || "",
        product_name: emailNotesList[0]?.title || "Study Notes",
        expiry_time: "48 hours"
      }
    }
  } else {
    brevoPayload = {
      ...brevoPayload,
      htmlContent: emailHtmlBody
    }
  }

  // Task 6: Log Brevo API request payload.
  console.log("Brevo request started with payload:", JSON.stringify(brevoPayload, null, 2));

  const brevoUrl = "https://api.brevo.com/v3/smtp/email";
  console.log("Request URL:", brevoUrl);
  const response = await fetch(brevoUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(brevoPayload)
  })

  // Task 6: Log Brevo response.
  const responseStatus = response.status;
  const responseText = await response.text();
  console.log(`Brevo response status: ${responseStatus}`);
  console.log(`Brevo response JSON: ${responseText}`);

  if (!response.ok) {
    logDebug({
      stage: "generate_and_send_email",
      message: "Brevo SMTP request failed",
      details: { status: responseStatus, errorText: responseText }
    })
    throw new Error(`Brevo SMTP dispatch failed: ${responseText}`)
  }

  console.log("Email sent successfully");

  // Task 11: Update orders.email_status
  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ email_status: 'sent' })
    .eq('id', order.id)

  if (updateErr) throw updateErr
  console.log("Database updated: email_status set to sent");

  await supabaseAdmin.from('email_logs').insert({
    order_id: order.id,
    email: order.customer_email,
    status: 'success',
    created_at: new Date().toISOString()
  })
}

serve(async (req) => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  // CORS options preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  // Environment variables check (evaluated dynamically at request time)
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") ?? ""
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? ""
  const razorpayWebhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? ""
  const brevoApiKey = Deno.env.get("BREVO_API_KEY") ?? ""

  const envCheck = {
    SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    RAZORPAY_KEY_ID: !!razorpayKeyId,
    RAZORPAY_KEY_SECRET: !!razorpayKeySecret,
    RAZORPAY_WEBHOOK_SECRET: !!razorpayWebhookSecret,
    BREVO_API_KEY: !!brevoApiKey
  }

  const missingEnvVars = Object.entries(envCheck)
    .filter(([_, exists]) => !exists)
    .map(([name]) => name)

  logDebug({
    stage: "init",
    message: "Environment variables check",
    details: envCheck
  })

  if (missingEnvVars.length > 0) {
    const error = createErrorResponse(
      "init",
      `Missing required environment variables: ${missingEnvVars.join(', ')}`,
      envCheck
    )
    logDebug({
      stage: "init",
      message: "Missing environment variables",
      details: missingEnvVars
    })
    return new Response(JSON.stringify(error), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Supabase keys
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Brevo keys
  const brevoTemplateId = Deno.env.get('BREVO_TEMPLATE_ID')
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'noreply@stethonotes.store'
  const fromName = Deno.env.get('FROM_NAME') ?? 'StethoNotes'

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace(/\/$/, "")
    
    logDebug({
      stage: "init",
      message: "Incoming request",
      details: {
        method: req.method,
        url: req.url,
        path: path
      }
    })

    // Determine action route from subpath or headers or JSON payload
    let action = ""
    let requestBody: any = null
    let parsedJson: any = null

    if (path.endsWith('/create-order')) {
      action = "create-order"
    } else if (path.endsWith('/verify-payment')) {
      action = "verify-payment"
    } else if (path.endsWith('/webhook')) {
      action = "webhook"
    } else {
      action = req.headers.get("x-action") || ""
      if (!action && req.method === "POST") {
        try {
          const clone = req.clone()
          requestBody = await clone.text()
          parsedJson = JSON.parse(requestBody)
          action = parsedJson.action || ""
          if (!action) {
            action = parsedJson.razorpay_payment_id ? 'verify-payment' : 'create-order'
          }
        } catch (parseErr: any) {
          logDebug({
            stage: "parse_body",
            message: "Failed to parse request body",
            details: { body: requestBody },
            stack: parseErr.stack
          })
        }
      }
    }

    logDebug({
      stage: "init",
      message: "Action determined",
      details: { action, hasParsedJson: !!parsedJson }
    })

    // --------------------------------------------------------
    // ENDPOINT: /create-order
    // --------------------------------------------------------
    if (action === 'create-order') {
      let bodyJson: any = null
      try {
        bodyJson = await req.json()
        requestBody = bodyJson
        logDebug({
          stage: "create-order",
          message: "Request body parsed",
          details: { 
            hasItems: !!bodyJson.items, 
            itemCount: bodyJson.items?.length,
            hasEmail: !!bodyJson.email,
            userId: bodyJson.userId,
            couponCode: bodyJson.couponCode
          }
        })
      } catch (parseErr: any) {
        logDebug({
          stage: "create-order",
          message: "Failed to parse JSON body",
          stack: parseErr.stack
        })
        const error = createErrorResponse(
          "create-order",
          "Invalid JSON in request body",
          { error: parseErr.message },
          parseErr.stack
        )
        return new Response(JSON.stringify(error), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { items, userId, name, email, phone, couponCode } = bodyJson

      if (!items || items.length === 0 || !email) {
        const error = createErrorResponse(
          "create-order",
          'Missing required fields: items or email',
          { items: items?.length, email }
        )
        return new Response(JSON.stringify(error), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const noteIds = items.map((i: any) => i.id)
        const { data: dbNotes, error: notesErr } = await supabaseAdmin
          .from('notes')
          .select('id, price')
          .in('id', noteIds)

        if (notesErr) {
          logDebug({
            stage: "create-order",
            message: "Database query for notes failed",
            details: notesErr
          })
          throw new Error(`Notes query failed: ${notesErr.message}`)
        }

        if (!dbNotes || dbNotes.length === 0) {
          throw new Error('Notes not found in catalog database.')
        }

        const subtotal = dbNotes.reduce((sum: number, note: any) => sum + Number(note.price), 0)

        if (subtotal <= 0) {
          throw new Error('Total checkout amount must be greater than zero.')
        }

        let discountAmount = 0
        if (couponCode) {
          const { data: couponData } = await supabaseAdmin
            .from('coupon_codes')
            .select('*')
            .eq('code', couponCode.toUpperCase())
            .eq('is_active', true)
            .single()

          if (couponData) {
            const isExpired = couponData.expiry_date && new Date(couponData.expiry_date) < new Date()
            if (!isExpired) {
              if (couponData.discount_type === 'percentage') {
                discountAmount = (subtotal * Number(couponData.discount_value)) / 100
              } else if (couponData.discount_type === 'fixed') {
                discountAmount = Number(couponData.discount_value)
              }
            }
          }
        }

        const afterDiscount = Math.max(0, subtotal - discountAmount)
        const gst = Number((afterDiscount * 0.18).toFixed(2))
        const platformFee = 5.00
        const grandTotal = Number((afterDiscount + gst + platformFee).toFixed(2))

        logDebug({
          stage: "create-order",
          message: "Calculated totals",
          details: { subtotal, discountAmount, afterDiscount, gst, platformFee, grandTotal }
        })

        const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
        const razorpayOrdersUrl = "https://api.razorpay.com/v1/orders";
        if (!razorpayOrdersUrl) throw new Error("Razorpay Orders URL is undefined");
        console.log("Request URL:", razorpayOrdersUrl);
        const razorpayOrderRes = await fetch(razorpayOrdersUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`
          },
          body: JSON.stringify({
            amount: Math.round(grandTotal * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
              note_ids: noteIds.join(","),
              user_id: userId || "",
              customer_name: name,
              customer_email: email.toLowerCase(),
              customer_phone: phone,
              coupon_code: couponCode || ""
            }
          })
        })

        logDebug({
          stage: "create-order",
          message: "Razorpay API response received",
          details: { status: razorpayOrderRes.status, ok: razorpayOrderRes.ok }
        })

        if (!razorpayOrderRes.ok) {
          const errText = await razorpayOrderRes.text()
          logDebug({
            stage: "create-order",
            message: "Razorpay order creation failed",
            details: { status: razorpayOrderRes.status, errorText: errText }
          })
          const error = createErrorResponse(
            "create-order",
            `Razorpay Order creation failed: ${errText}`,
            { status: razorpayOrderRes.status }
          )
          return new Response(JSON.stringify(error), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const razorpayOrder = await razorpayOrderRes.json()
        logDebug({
          stage: "create-order",
          message: "Razorpay order created successfully",
          details: { orderId: razorpayOrder.id }
        })

        return new Response(JSON.stringify({
          success: true,
          order_id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          razorpay_key_id: razorpayKeyId
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (createErr: any) {
        logDebug({
          stage: "create-order",
          message: "Error in create-order flow",
          details: createErr.message,
          stack: createErr.stack
        })
        const error = createErrorResponse(
          "create-order",
          createErr.message,
          createErr,
          createErr.stack
        )
        return new Response(JSON.stringify(error), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // --------------------------------------------------------
    // ENDPOINT: /verify-payment
    // --------------------------------------------------------
    else if (action === 'verify-payment') {
      let bodyJson: any = null
      try {
        bodyJson = await req.json()
        logDebug({
          stage: "verify-payment",
          message: "Request body parsed",
          details: {
            paymentId: bodyJson.razorpay_payment_id,
            orderId: bodyJson.razorpay_order_id
          }
        })
      } catch (parseErr: any) {
        logDebug({
          stage: "verify-payment",
          message: "Failed to parse JSON body",
          stack: parseErr.stack
        })
        const error = createErrorResponse(
          "verify-payment",
          "Invalid JSON in request body",
          { error: parseErr.message },
          parseErr.stack
        )
        return new Response(JSON.stringify(error), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        note_ids,
        user_id,
        customer_name,
        customer_email,
        customer_phone
      } = bodyJson

      try {
        const dataToVerify = `${razorpay_order_id}|${razorpay_payment_id}`
        const isVerified = await verifyHmacSignature(dataToVerify, razorpay_signature, razorpayKeySecret)

        if (!isVerified) {
          const error = createErrorResponse(
            "verify-payment",
            'Invalid payment signature',
            { paymentId: razorpay_payment_id }
          )
          return new Response(JSON.stringify(error), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
        if (!razorpay_payment_id) {
          throw new Error("razorpay_payment_id is undefined or empty");
        }
        const razorpayPaymentUrl = `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`;
        if (!razorpayPaymentUrl) throw new Error("Razorpay Payment URL is undefined");
        console.log("Request URL:", razorpayPaymentUrl);
        const payRes = await fetch(razorpayPaymentUrl, {
          headers: { "Authorization": `Basic ${auth}` }
        })

        logDebug({
          stage: "verify-payment",
          message: "Payment verification response from Razorpay",
          details: { status: payRes.status }
        })

        if (!payRes.ok) {
          const errorText = await payRes.text()
          throw new Error(`Failed to fetch payment details from Razorpay: ${errorText}`)
        }

        const paymentDetails = await payRes.json()
        const paidAmount = Number(paymentDetails.amount) / 100

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

          if (!dbNotes || dbNotes.length === 0) {
            throw new Error('Notes not found in catalog database.')
          }

          const { data: newOrder, error: orderErr } = await supabaseAdmin
            .from('orders')
            .insert({
              user_id: user_id || null,
              customer_name,
              customer_email: customer_email.toLowerCase(),
              customer_phone,
              total_amount: paidAmount,
              razorpay_payment_id,
              payment_status: 'completed',
              email_status: 'pending'
            })
            .select()
            .single()

          if (orderErr || !newOrder) throw orderErr
          dbOrder = newOrder

          const orderItemsPayload = dbNotes.map((note: any) => ({
            order_id: dbOrder.id,
            note_id: note.id,
            price: note.price
          }))

          const { error: itemsErr } = await supabaseAdmin
            .from('order_items')
            .insert(orderItemsPayload)

          if (itemsErr) throw itemsErr

          await supabaseAdmin
            .from('payments')
            .insert({
              order_id: dbOrder.id,
              razorpay_payment_id,
              razorpay_order_id,
              razorpay_signature,
              amount: paidAmount,
              status: 'captured'
            })
        }

        const { data: orderItemsData } = await supabaseAdmin
          .from('order_items')
          .select('*, note:notes(*)')
          .eq('order_id', dbOrder.id)

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
            error_message: emailErr.message,
            created_at: new Date().toISOString()
          })

          // UX Safeguard: The customer's payment succeeded. Do not fail the checkout!
          // Return success: true but flag the email failure.
          return new Response(JSON.stringify({ 
            success: true, 
            order_id: dbOrder.id,
            email_delivery_failed: true,
            email_error: emailErr.message
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({ success: true, order_id: dbOrder.id }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (verifyErr: any) {
        logDebug({
          stage: "verify-payment",
          message: "Error in verify-payment flow",
          details: verifyErr.message,
          stack: verifyErr.stack
        })
        const error = createErrorResponse(
          "verify-payment",
          verifyErr.message,
          verifyErr,
          verifyErr.stack
        )
        return new Response(JSON.stringify(error), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // --------------------------------------------------------
    // ENDPOINT: /resend-email
    // --------------------------------------------------------
    else if (action === 'resend-email') {
      let bodyJson: any = null
      try {
        bodyJson = await req.json()
      } catch (parseErr: any) {
        return new Response(JSON.stringify({ success: false, message: "Invalid JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { order_id } = bodyJson
      if (!order_id) {
        return new Response(JSON.stringify({ success: false, message: "order_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        console.log(`Resend Email requested for order: ${order_id}`);
        // Fetch order details
        const { data: dbOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', order_id)
          .single()

        if (orderErr || !dbOrder) {
          throw new Error(`Order not found: ${orderErr?.message || ''}`)
        }

        // Fetch order items with note details
        const { data: orderItemsData, error: itemsErr } = await supabaseAdmin
          .from('order_items')
          .select('*, note:notes(*)')
          .eq('order_id', order_id)

        if (itemsErr || !orderItemsData || orderItemsData.length === 0) {
          throw new Error(`Order items not found: ${itemsErr?.message || ''}`)
        }

        // Send email (this generates fresh signed URLs and dispatches via Brevo)
        await generateAndSendEmail(
          supabaseAdmin,
          dbOrder,
          orderItemsData,
          brevoApiKey,
          brevoTemplateId,
          fromEmail,
          fromName
        )

        return new Response(JSON.stringify({ success: true, message: "Email resent successfully" }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (resendErr: any) {
        logDebug({
          stage: "resend-email",
          message: "Error in resend-email flow",
          details: resendErr.message
        })
        return new Response(JSON.stringify({
          success: false,
          message: `Resend failed: ${resendErr.message}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // --------------------------------------------------------
    // ENDPOINT: /get-payment-log
    // --------------------------------------------------------
    else if (action === 'get-payment-log') {
      let bodyJson: any = null
      try {
        bodyJson = await req.json()
      } catch (parseErr: any) {
        return new Response(JSON.stringify({ success: false, message: "Invalid JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { payment_id } = bodyJson
      if (!payment_id) {
        return new Response(JSON.stringify({ success: false, message: "payment_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        console.log(`Fetching payment log from Razorpay for: ${payment_id}`);
        const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
        const razorpayPaymentUrl = `https://api.razorpay.com/v1/payments/${payment_id}`;
        const response = await fetch(razorpayPaymentUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Razorpay API responded with status ${response.status}: ${errorText}`)
        }

        const paymentData = await response.json()
        return new Response(JSON.stringify({ success: true, log: paymentData }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (err: any) {
        console.error("Error fetching payment log:", err)
        return new Response(JSON.stringify({ success: false, message: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // --------------------------------------------------------
    // ENDPOINT: /list-payments
    // --------------------------------------------------------
    else if (action === 'list-payments') {
      try {
        console.log(`Listing payments from Razorpay`);
        const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
        const razorpayListUrl = `https://api.razorpay.com/v1/payments?count=10`;
        const response = await fetch(razorpayListUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Razorpay API responded with status ${response.status}: ${errorText}`)
        }

        const paymentsList = await response.json()
        return new Response(JSON.stringify({ success: true, payments: paymentsList.items }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (err: any) {
        console.error("Error listing payments:", err)
        return new Response(JSON.stringify({ success: false, message: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // --------------------------------------------------------
    // ENDPOINT: /webhook
    // --------------------------------------------------------
    else if (action === 'webhook') {
      let webhookBody: string = ""
      try {
        webhookBody = await req.text()
      } catch (textErr: any) {
        logDebug({
          stage: "webhook",
          message: "Failed to read webhook body",
          stack: textErr.stack
        })
        return new Response(JSON.stringify({ success: false, message: 'Failed to read webhook body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const signature = req.headers.get('x-razorpay-signature') ?? ""

      const isVerified = await verifyHmacSignature(webhookBody, signature, razorpayWebhookSecret)
      if (!isVerified) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid webhook signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let payload: any = null
      try {
        payload = JSON.parse(webhookBody)
      } catch (parseErr: any) {
        logDebug({
          stage: "webhook",
          message: "Failed to parse webhook JSON",
          stack: parseErr.stack
        })
        return new Response(JSON.stringify({ success: false, message: 'Invalid webhook payload' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const event = payload.event

      if (event === 'order.paid' || event === 'payment.captured') {
        const payment = payload.payload.payment.entity
        const razorpay_payment_id = payment.id
        const razorpay_order_id = payment.order_id
        const paidAmount = Number(payment.amount) / 100

        const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
        if (!razorpay_order_id) {
          throw new Error("razorpay_order_id is undefined or empty");
        }
        const razorpayOrderUrl = `https://api.razorpay.com/v1/orders/${razorpay_order_id}`;
        if (!razorpayOrderUrl) throw new Error("Razorpay Order URL is undefined");
        console.log("Request URL:", razorpayOrderUrl);
        const orderRes = await fetch(razorpayOrderUrl, {
          headers: { "Authorization": `Basic ${auth}` }
        })

        logDebug({
          stage: "webhook",
          message: "Razorpay order lookup response",
          details: { status: orderRes.status }
        })

        if (!orderRes.ok) {
          throw new Error(`Webhook order lookup failed: ${await orderRes.text()}`)
        }

        const razorpayOrderObj = await orderRes.json()
        const meta = razorpayOrderObj.notes || {}
        const note_ids = (meta.note_ids || "").split(",").filter(Boolean)

        if (note_ids.length > 0) {
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
              const { data: newOrder } = await supabaseAdmin
                .from('orders')
                .insert({
                  user_id: meta.user_id ? meta.user_id : null,
                  customer_name: meta.customer_name || 'Customer',
                  customer_email: (meta.customer_email || 'support@stethonotes.store').toLowerCase(),
                  customer_phone: meta.customer_phone || '',
                  total_amount: paidAmount,
                  razorpay_payment_id,
                  payment_status: 'completed',
                  email_status: 'pending'
                })
                .select()
                .single()

              dbOrder = newOrder

              if (dbOrder) {
                const orderItemsPayload = dbNotes.map((note: any) => ({
                  order_id: dbOrder.id,
                  note_id: note.id,
                  price: note.price
                }))

                await supabaseAdmin
                  .from('order_items')
                  .insert(orderItemsPayload)

                await supabaseAdmin
                  .from('payments')
                  .insert({
                    order_id: dbOrder.id,
                    razorpay_payment_id,
                    razorpay_order_id,
                    amount: paidAmount,
                    status: 'captured'
                  })
              }
            }
          }

          if (dbOrder && dbOrder.email_status !== 'sent') {
            const { data: orderItemsData } = await supabaseAdmin
              .from('order_items')
              .select('*, note:notes(*)')
              .eq('order_id', dbOrder.id)

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


    // --------------------------------------------------------
    // ENDPOINT: resend-email (Admin Manual Trigger)
    // --------------------------------------------------------
    else if (action === 'resend-email') {
      let bodyJson: any = null
      try {
        bodyJson = parsedJson ?? await req.json()
      } catch (_) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid JSON body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { order_id } = bodyJson
      if (!order_id) {
        return new Response(JSON.stringify({ success: false, message: 'Missing order_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch the order from DB
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single()

      if (orderErr || !order) {
        return new Response(JSON.stringify({ success: false, message: `Order not found: ${order_id}` }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (order.payment_status !== 'completed') {
        return new Response(JSON.stringify({ success: false, message: 'Cannot resend email for non-completed order.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch order items with note details
      const { data: items, error: itemsErr } = await supabaseAdmin
        .from('order_items')
        .select('*, note:notes(id, title, subject, pdf_url)')
        .eq('order_id', order_id)

      if (itemsErr || !items || items.length === 0) {
        return new Response(JSON.stringify({ success: false, message: 'No order items found for this order.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        await generateAndSendEmail(supabaseAdmin, order, items, brevoApiKey, brevoTemplateId, fromEmail, fromName)
        logDebug({ stage: 'resend-email', message: 'Email resent successfully', details: { order_id } })
        return new Response(JSON.stringify({ success: true, message: `Email resent to ${order.customer_email}` }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (emailErr: any) {
        logDebug({ stage: 'resend-email', message: 'Email resend failed', details: emailErr.message, stack: emailErr.stack })
        return new Response(JSON.stringify({ success: false, message: emailErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // --------------------------------------------------------
    // ENDPOINT: list-payments (Fetch recent Razorpay payments)
    // --------------------------------------------------------
    else if (action === 'list-payments') {
      const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      const rzpRes = await fetch('https://api.razorpay.com/v1/payments?count=10&expand[]=card', {
        headers: { 'Authorization': `Basic ${auth}` }
      })
      if (!rzpRes.ok) {
        const errText = await rzpRes.text()
        return new Response(JSON.stringify({ success: false, message: `Razorpay API error: ${errText}` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const rzpData = await rzpRes.json()
      return new Response(JSON.stringify({ success: true, payments: rzpData.items ?? rzpData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --------------------------------------------------------
    // ENDPOINT: get-payment-log (Fetch single payment from Razorpay)
    // --------------------------------------------------------
    else if (action === 'get-payment-log') {
      let bodyJson: any = null
      try {
        bodyJson = parsedJson ?? await req.json()
      } catch (_) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid JSON body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { payment_id } = bodyJson
      if (!payment_id) {
        return new Response(JSON.stringify({ success: false, message: 'Missing payment_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      })

      if (!rzpRes.ok) {
        const errText = await rzpRes.text()
        return new Response(JSON.stringify({ success: false, message: `Razorpay API error: ${errText}` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const rzpData = await rzpRes.json()
      return new Response(JSON.stringify({ success: true, payment: rzpData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: false, message: 'Invalid endpoint route' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })


  } catch (err: any) {
    logDebug({
      stage: "unknown",
      message: "Unhandled error in Razorpay function",
      details: err.message,
      stack: err.stack
    })
    const error = createErrorResponse(
      "unknown",
      err.message,
      err,
      err.stack
    )
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})