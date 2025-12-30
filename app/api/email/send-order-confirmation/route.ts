import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const {
      to,
      orderId,
      restaurantName,
      tableNumber,
      orderedItems,
      totalAmount,
      orderTime,
      paymentMethod,
      paymentStatus,
    } = await req.json();

    if (!to || !orderId || !restaurantName || !tableNumber || !orderedItems || !totalAmount || !orderTime || !paymentMethod || !paymentStatus) {
      return NextResponse.json({ error: "Missing required email parameters" }, { status: 400 });
    }

    const itemRows = orderedItems.map(
      (item: any) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">GH₵${item.price.toFixed(2)}</td>
      </tr>
      `
    ).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
          <style>
              body {
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f4f4f4;
                  color: #333;
              }
              .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  text-align: center;
                  padding-bottom: 20px;
                  border-bottom: 1px solid #eee;
              }
              .header h1 {
                  color: #333;
                  font-size: 24px;
                  margin: 0;
              }
              .content {
                  padding: 20px 0;
              }
              .content p {
                  margin: 0 0 10px;
              }
              .order-details table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 15px;
              }
              .order-details th, .order-details td {
                  padding: 10px;
                  border-bottom: 1px solid #eee;
                  text-align: left;
              }
              .order-details th {
                  background-color: #f9f9f9;
              }
              .order-summary {
                  margin-top: 20px;
                  border-top: 1px solid #eee;
                  padding-top: 15px;
              }
              .order-summary p {
                  display: flex;
                  justify-content: space-between;
                  margin: 5px 0;
                  font-size: 16px;
              }
              .order-summary .total {
                  font-size: 20px;
                  font-weight: bold;
                  color: #28a745;
              }
              .footer {
                  text-align: center;
                  padding-top: 20px;
                  border-top: 1px solid #eee;
                  color: #777;
                  font-size: 12px;
              }
              @media only screen and (max-width: 600px) {
                  .container {
                      width: 100%;
                      margin: 0;
                      border-radius: 0;
                      box-shadow: none;
                  }
                  .order-details th, .order-details td {
                      padding: 8px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Order Confirmation - #${orderId}</h1>
              </div>
              <div class="content">
                  <p>Dear Customer,</p>
                  <p>Thank you for your order at <strong>${restaurantName}</strong>! Your order has been successfully placed and confirmed.</p>
                  <p>Below are the details of your order:</p>

                  <div class="order-details">
                      <p><strong>Order ID:</strong> ${orderId}</p>
                      <p><strong>Restaurant:</strong> ${restaurantName}</p>
                      <p><strong>Table Number:</strong> ${tableNumber}</p>
                      <p><strong>Order Time:</strong> ${orderTime}</p>
                      <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                      <p><strong>Payment Status:</strong> ${paymentStatus}</p>

                      <h3>Ordered Items:</h3>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <thead>
                              <tr>
                                  <th style="text-align: left;">Item</th>
                                  <th style="text-align: center;">Qty</th>
                                  <th style="text-align: right;">Price</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${itemRows}
                          </tbody>
                      </table>
                  </div>

                  <div class="order-summary">
                      <p class="total"><span>Total Amount:</span> <span>GH₵${totalAmount.toFixed(2)}</span></p>
                  </div>

                  <p>We will notify you once your order is ready or its status changes.</p>
                  <p>Thank you for choosing ${restaurantName}. We look forward to serving you again!</p>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} ${restaurantName}. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
    from: "ChefFlow <onboarding@resend.dev>",// IMPORTANT: Replace this with an email address on the domain you verified with Resend.
      to: [to],
      subject: `Your ChefFlow Order Confirmation - #${orderId}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Order confirmation email sent!", data }, { status: 200 });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
