import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PDFDocument, rgb, degrees, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, noteId } = await req.json()

    if (!orderId || !noteId) {
      return new Response(JSON.stringify({ error: 'Missing orderId or noteId parameters.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Supabase Client with Service Role (Admin privileges)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch order details
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (order.payment_status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Payment has not been completed.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Validate Age (48 hours threshold)
    const orderTime = new Date(order.created_at).getTime()
    const expiryTime = orderTime + 48 * 60 * 60 * 1000
    if (Date.now() > expiryTime) {
      return new Response(JSON.stringify({ error: 'This download link has expired.' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Validate Count (Max 3)
    const { count, error: countErr } = await supabase
      .from('download_history')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .eq('note_id', noteId)

    if (countErr) {
      console.error('Error fetching download logs:', countErr)
    }

    const currentDownloads = count || 0
    if (currentDownloads >= 3) {
      return new Response(JSON.stringify({ error: 'Download limit exceeded (3 maximum).' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Fetch Note info
    const { data: note, error: noteErr } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()

    if (noteErr || !note) {
      return new Response(JSON.stringify({ error: 'Study note not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Watermark file storage path prefix
    const watermarkedPath = `watermarked/${orderId}/${noteId}.pdf`

    // 5. Check if watermarked file already compiled and cached in Storage
    let cachedUrl = null
    const { data: existingFiles, error: listErr } = await supabase.storage
      .from('notes-pdfs')
      .list(`watermarked/${orderId}`, { search: `${noteId}.pdf` })

    const isCached = !listErr && existingFiles && existingFiles.some(f => f.name === `${noteId}.pdf`)

    if (!isCached) {
      console.log(`[WATERMARK] Compiling personalized PDF for order ${orderId}, note ${noteId}...`)
      // Download raw PDF from storage
      const { data: rawPdfData, error: getErr } = await supabase.storage
        .from('notes-pdfs')
        .download(note.pdf_url)

      if (getErr || !rawPdfData) {
        console.error(`[STORAGE_ERROR] Could not fetch note file:`, getErr)
        return new Response(JSON.stringify({ error: 'Could not retrieve original note PDF document.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Read PDF bytes and load into PDFDocument
      const rawPdfBytes = await rawPdfData.arrayBuffer()
      const pdfDoc = await PDFDocument.load(rawPdfBytes)
      const pages = pdfDoc.getPages()
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // Build watermark string
      const customerName = order.customer_name || 'StethoNotes Buyer'
      const customerEmail = order.customer_email || 'buyer@stethonotes.com'
      const purchaseDate = new Date(order.created_at).toLocaleDateString()
      const watermarkText = `STETHONOTES - Purchased by ${customerName} (${customerEmail}) - Order: ${orderId} - Date: ${purchaseDate}`

      // Overlay diagonal watermark text on every page
      for (const page of pages) {
        const { width, height } = page.getSize()
        
        // Add repeated semi-transparent watermark text diagonally
        page.drawText(watermarkText, {
          x: width / 12,
          y: height / 4,
          size: 13,
          font: font,
          color: rgb(0.7, 0.7, 0.7), // light gray
          opacity: 0.18,
          rotate: degrees(45),
        })

        page.drawText(watermarkText, {
          x: width / 12,
          y: (height * 3) / 4,
          size: 13,
          font: font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.18,
          rotate: degrees(45),
        })
      }

      // Save PDF document
      const watermarkedPdfBytes = await pdfDoc.save()

      // Upload watermarked copy back to private storage
      const { error: uploadErr } = await supabase.storage
        .from('notes-pdfs')
        .upload(watermarkedPath, watermarkedPdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadErr) {
        console.error(`[STORAGE_ERROR] Could not save watermarked copy:`, uploadErr)
        return new Response(JSON.stringify({ error: 'Could not cache secure watermarked note copy.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      console.log(`[WATERMARK] Reusing cached PDF for order ${orderId}, note ${noteId}...`)
    }

    // 6. Generate signed URL for watermarked PDF (valid for 5 minutes)
    const { data: signedData, error: signErr } = await supabase.storage
      .from('notes-pdfs')
      .createSignedUrl(watermarkedPath, 300)

    if (signErr || !signedData?.signedUrl) {
      console.error(`[STORAGE_ERROR] Could not generate signed URL:`, signErr)
      return new Response(JSON.stringify({ error: 'Could not generate secure file retrieval link.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 7. Log to download_history
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || 'Unknown Browser'

    const { error: logErr } = await supabase
      .from('download_history')
      .insert({
        order_id: orderId,
        note_id: noteId,
        ip_address: ip,
        user_agent: userAgent,
        downloaded_at: new Date().toISOString()
      })

    if (logErr) {
      console.error(`[DB_ERROR] Failed to log download history:`, logErr)
    }

    // Return signed URL
    return new Response(JSON.stringify({ signedUrl: signedData.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error(`[EDGE_FUNCTION_ERROR] download-notes:`, err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
