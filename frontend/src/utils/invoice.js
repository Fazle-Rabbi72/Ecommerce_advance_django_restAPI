/**
 * Utility to generate and download/print an official, high-resolution PDF invoice
 * for any order in LuxeStore.
 */
export const downloadInvoice = (order) => {
  if (!order) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download and print your invoice.");
    return;
  }

  const items = order.orderitem || [];
  const itemsHtml = items.length > 0
    ? items
        .map(
          (item) => `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">
            <strong>${item.product?.title || "Product Item"}</strong>
            ${
              item.size || item.color
                ? `<span style="color: #64748b; font-size: 11px; display: block; margin-top: 3px;">
                    ${item.size ? `Size: ${item.size}` : ""} ${
                    item.color ? `| Color: ${item.color}` : ""
                  }
                   </span>`
                : ""
            }
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #334155;">
            ${item.quantity || 1}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; color: #0f172a; font-weight: 600;">
            $${Number(item.price || 0).toFixed(2)}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; color: #0f172a; font-weight: 700;">
            $${Number(item.sub_total || item.total || item.price || 0).toFixed(2)}
          </td>
        </tr>
      `
        )
        .join("")
    : `<tr><td colspan="4" style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">No items recorded in this order</td></tr>`;

  const formattedDate = order.date
    ? new Date(order.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Invoice - #${order.oid || "ORDER"}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 40px;
            color: #0f172a;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .container { max-width: 820px; margin: 0 auto; }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 24px;
            border-bottom: 2px solid #e2e8f0;
          }
          .brand-logo {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #4f46e5;
          }
          .brand-tagline {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
          }
          .invoice-meta { text-align: right; }
          .invoice-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .invoice-date {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .badge-paid {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 14px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin: 32px 0;
          }
          .card {
            background: #f8fafc;
            border-radius: 16px;
            padding: 20px;
            border: 1px solid #e2e8f0;
          }
          .card-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.75px;
            color: #64748b;
            margin-bottom: 10px;
          }
          .card p {
            margin: 3px 0;
            font-size: 13px;
            color: #334155;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 28px 0;
          }
          thead th {
            background: #f1f5f9;
            padding: 12px 16px;
            text-align: left;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #cbd5e1;
          }
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
          }
          .summary-box {
            width: 320px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            color: #64748b;
          }
          .summary-row strong { color: #0f172a; }
          .summary-total {
            display: flex;
            justify-content: space-between;
            padding: 12px 0 0 0;
            margin-top: 10px;
            border-top: 2px solid #cbd5e1;
            font-size: 16px;
            font-weight: 900;
            color: #4f46e5;
          }
          .footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
          .no-print-bar {
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background: #f1f5f9;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .print-btn {
            background: #4f46e5;
            color: #ffffff;
            border: none;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
          }
          @media print {
            body { padding: 0; }
            .no-print-bar { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="no-print-bar">
            <span style="font-size: 13px; color: #475569; font-weight: 600;">
              Previewing Invoice #${order.oid}
            </span>
            <button class="print-btn" onclick="window.print()">
              Download as PDF / Print
            </button>
          </div>

          <div class="header">
            <div>
              <div class="brand-logo">LUXESTORE</div>
              <div class="brand-tagline">Curated Luxury Lifestyle & Essentials</div>
            </div>
            <div class="invoice-meta">
              <h1 class="invoice-title">TAX INVOICE</h1>
              <div class="invoice-date">Date: ${formattedDate}</div>
              <div class="invoice-date">Order ID: <strong>#${order.oid || "N/A"}</strong></div>
              <div class="badge-paid">${order.payment_status?.toUpperCase() || "PAID"}</div>
            </div>
          </div>

          <div class="details-grid">
            <div class="card">
              <div class="card-title">Billed To</div>
              <p><strong>${order.full_name || "Customer"}</strong></p>
              <p>${order.email || ""}</p>
              <p>${order.mobile || ""}</p>
            </div>
            <div class="card">
              <div class="card-title">Delivery Destination</div>
              <p>${order.address || ""}</p>
              <p>${order.city || ""}${order.state ? `, ${order.state}` : ""}</p>
              <p>${order.country || ""}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-section">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <strong>$${Number(order.sub_total || 0).toFixed(2)}</strong>
              </div>
              <div class="summary-row">
                <span>Shipping Fee</span>
                <strong>$${Number(order.shipping_amount || 0).toFixed(2)}</strong>
              </div>
              <div class="summary-row">
                <span>Estimated Tax</span>
                <strong>$${Number(order.tax_fee || 0).toFixed(2)}</strong>
              </div>
              <div class="summary-row">
                <span>Service Fee</span>
                <strong>$${Number(order.service_fee || 0).toFixed(2)}</strong>
              </div>
              <div class="summary-total">
                <span>Total Amount Paid</span>
                <span>$${Number(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with LuxeStore. For assistance, contact support@luxestore.com.</p>
            <p>© ${new Date().getFullYear()} LuxeStore Inc. All rights reserved.</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
};
