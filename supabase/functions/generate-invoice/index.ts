// ============================================================
// generate-invoice — Supabase Edge Function
// Generates GST-compliant invoice PDF for an order and stores it
// in the private `invoices` Storage bucket.
//
// Trigger:
//   POST /functions/v1/generate-invoice
//   Body: { order_id: UUID } OR { invoice_id: UUID }
//
// Called by: admin (regenerate button) OR automated queue processor.
// ============================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await req.json()
    const { order_id, invoice_id } = body

    // Locate the invoice row
    let invoiceRow: any = null
    if (invoice_id) {
      const { data } = await supabase.from('invoices').select('*').eq('id', invoice_id).single()
      invoiceRow = data
    } else if (order_id) {
      const { data } = await supabase.from('invoices').select('*').eq('order_id', order_id).single()
      invoiceRow = data
    }

    if (!invoiceRow) {
      return new Response(JSON.stringify({ success: false, message: 'Invoice row not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch order + items
    const { data: order } = await supabase.from('orders').select('*').eq('id', invoiceRow.order_id).single()
    const { data: items } = await supabase
      .from('order_items')
      .select('*, note:notes(id, title, subject)')
      .eq('order_id', invoiceRow.order_id)

    if (!order) {
      throw new Error('Order not found')
    }

    // Build the PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const primary = rgb(0.059, 0.176, 0.42)   // #0F2D6B
    const accent = rgb(0.122, 0.714, 0.831)   // #1FB6D4
    const text = rgb(0.2, 0.2, 0.2)
    const muted = rgb(0.5, 0.5, 0.5)

    let y = 800

    // Header
    page.drawText('StethoNotes', { x: 50, y, font: helveticaBold, size: 22, color: primary })
    page.drawText('India\'s largest student-powered digital marketplace', { x: 50, y: y - 16, font: helvetica, size: 8, color: muted })
    page.drawText('TAX INVOICE', { x: 430, y, font: helveticaBold, size: 14, color: accent })
    page.drawText(invoiceRow.invoice_number, { x: 430, y: y - 16, font: helvetica, size: 9, color: text })

    y -= 50
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: accent })

    y -= 24
    // Billed To
    page.drawText('BILLED TO', { x: 50, y, font: helveticaBold, size: 8, color: muted })
    page.drawText(invoiceRow.customer_name || order.customer_name || 'Customer', { x: 50, y: y - 14, font: helveticaBold, size: 11, color: text })
    page.drawText(invoiceRow.customer_email || order.customer_email || '', { x: 50, y: y - 28, font: helvetica, size: 9, color: text })
    if (order.customer_phone) {
      page.drawText(order.customer_phone, { x: 50, y: y - 42, font: helvetica, size: 9, color: text })
    }

    // Invoice meta
    page.drawText('INVOICE DATE', { x: 380, y, font: helveticaBold, size: 8, color: muted })
    page.drawText(new Date(invoiceRow.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }), { x: 380, y: y - 14, font: helvetica, size: 9, color: text })
    page.drawText('ORDER ID', { x: 380, y: y - 32, font: helveticaBold, size: 8, color: muted })
    page.drawText(order.id.substring(0, 24) + '...', { x: 380, y: y - 46, font: helvetica, size: 8, color: text })
    if (order.razorpay_payment_id) {
      page.drawText('PAYMENT REF', { x: 380, y: y - 62, font: helveticaBold, size: 8, color: muted })
      page.drawText(order.razorpay_payment_id, { x: 380, y: y - 76, font: helvetica, size: 8, color: text })
    }

    y -= 108

    // Items table header
    page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 24, color: rgb(0.95, 0.97, 0.99) })
    page.drawText('ITEM', { x: 60, y: y + 4, font: helveticaBold, size: 9, color: primary })
    page.drawText('SUBJECT', { x: 300, y: y + 4, font: helveticaBold, size: 9, color: primary })
    page.drawText('AMOUNT (INR)', { x: 470, y: y + 4, font: helveticaBold, size: 9, color: primary })
    y -= 30

    for (const item of items || []) {
      const title = item.note?.title || 'Study Notes'
      const subject = item.note?.subject || '—'
      const price = Number(item.price).toFixed(2)
      const truncated = title.length > 45 ? title.substring(0, 45) + '...' : title
      page.drawText(truncated, { x: 60, y, font: helvetica, size: 9, color: text })
      page.drawText(subject.substring(0, 24), { x: 300, y, font: helvetica, size: 9, color: text })
      page.drawText(price, { x: 490, y, font: helvetica, size: 9, color: text })
      y -= 18
    }

    y -= 16
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

    // Totals block (right aligned)
    y -= 20
    const totalsX = 380
    const valX = 520
    const drawTotalRow = (label: string, value: string, bold = false) => {
      const f = bold ? helveticaBold : helvetica
      const c = bold ? primary : text
      page.drawText(label, { x: totalsX, y, font: f, size: bold ? 10 : 9, color: c })
      page.drawText(value, { x: valX - value.length * 5, y, font: f, size: bold ? 10 : 9, color: c })
      y -= 16
    }

    drawTotalRow('Subtotal', `INR ${Number(invoiceRow.subtotal || 0).toFixed(2)}`)
    if (invoiceRow.discount && Number(invoiceRow.discount) > 0) {
      drawTotalRow('Discount', `- INR ${Number(invoiceRow.discount).toFixed(2)}`)
    }
    drawTotalRow('GST (18%)', `INR ${Number(invoiceRow.gst || 0).toFixed(2)}`)
    if (invoiceRow.platform_fee && Number(invoiceRow.platform_fee) > 0) {
      drawTotalRow('Platform fee', `INR ${Number(invoiceRow.platform_fee).toFixed(2)}`)
    }
    y -= 4
    page.drawLine({ start: { x: totalsX, y: y + 4 }, end: { x: 545, y: y + 4 }, thickness: 0.5, color: primary })
    drawTotalRow('Grand Total', `INR ${Number(invoiceRow.total).toFixed(2)}`, true)

    // Payment status stamp
    y -= 30
    const stamp = order.payment_status === 'refunded' ? 'REFUNDED' : 'PAID'
    const stampColor = order.payment_status === 'refunded' ? rgb(0.86, 0.15, 0.15) : rgb(0.05, 0.55, 0.35)
    page.drawRectangle({ x: 380, y: y - 6, width: 165, height: 26, borderColor: stampColor, borderWidth: 1.5, color: rgb(1, 1, 1) })
    page.drawText(stamp, { x: 425, y: y + 2, font: helveticaBold, size: 14, color: stampColor })

    // Footer
    page.drawText('Thank you for choosing StethoNotes.', { x: 50, y: 90, font: helveticaBold, size: 10, color: primary })
    page.drawText('This is a system-generated invoice and does not require a signature.', { x: 50, y: 74, font: helvetica, size: 8, color: muted })
    page.drawText('Support: support@stethonotes.store  |  Website: https://stethonotes.store', { x: 50, y: 60, font: helvetica, size: 8, color: muted })
    page.drawText('StethoNotes © 2026. All rights reserved.', { x: 50, y: 46, font: helvetica, size: 7, color: muted })

    const pdfBytes = await pdfDoc.save()

    // Upload to Storage
    const now = new Date()
    const storagePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${invoiceRow.invoice_number.replace(/[/]/g, '_')}.pdf`

    const { error: uploadErr } = await supabase.storage
      .from('invoices')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadErr) {
      await supabase
        .from('invoices')
        .update({ generation_status: 'failed', generation_error: uploadErr.message })
        .eq('id', invoiceRow.id)
      throw uploadErr
    }

    await supabase
      .from('invoices')
      .update({ generation_status: 'generated', storage_path: storagePath })
      .eq('id', invoiceRow.id)

    // Signed URL for immediate return
    const { data: signed } = await supabase.storage
      .from('invoices')
      .createSignedUrl(storagePath, 3600)

    return new Response(JSON.stringify({
      success: true,
      invoice_id: invoiceRow.id,
      invoice_number: invoiceRow.invoice_number,
      storage_path: storagePath,
      signed_url: signed?.signedUrl || null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('generate-invoice error:', err)
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
