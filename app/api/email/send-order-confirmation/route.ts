import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const {
      to,
      orderId,
      restaurantName,
      restaurantLogo,
      tableNumber,
      orderedItems, // Assuming orderedItems now contains image_url
      totalAmount,
      orderTime,
      paymentMethod,
      paymentStatus,
    } = await req.json();

    if (!to || !orderId || !restaurantName || !tableNumber || !orderedItems || !totalAmount || !orderTime || !paymentMethod || !paymentStatus) {
      return NextResponse.json({ error: "Missing required email parameters" }, { status: 400 });
    }

    const toAbsoluteUrl = (url: string | undefined | null, origin: string) => {
      if (!url) return undefined;
      // If the URL is already absolute, return it as is.
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      // If it's a relative URL, prepend the origin.
      // Ensure there's always a single slash between origin and path.
      return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const absoluteRestaurantLogo = toAbsoluteUrl(restaurantLogo, req.nextUrl.origin);
    console.log("Absolute Restaurant Logo URL:", absoluteRestaurantLogo); // Debugging log

    const itemRows = orderedItems.map(
      (item: any) => {
        const absoluteItemImageUrl = toAbsoluteUrl(item.imageUrl, req.nextUrl.origin);
        console.log("Absolute Item Image URL:", absoluteItemImageUrl); // Debugging log
        return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center;">
            ${absoluteItemImageUrl ? `<img src="${absoluteItemImageUrl}" alt="${item.name}" width="50" style="margin-right: 10px; border-radius: 4px;">` : ""}
            <span>${item.name}</span>
          </div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">GH₵${item.price.toFixed(2)}</td>
      </tr>
      `;
      }
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
                  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f8f8f8;
                  color: #333;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
              }
              .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                  overflow: hidden;
              }
              .header {
                  background-color: #4CAF50; /* A fresh green */
                  padding: 30px 20px;
                  text-align: center;
                  color: #ffffff;
              }
              .header img {
                  max-width: 120px;
                  height: auto;
                  margin-bottom: 15px;
                  border-radius: 8px;
              }
              .header h1 {
                  font-size: 28px;
                  margin: 0;
                  font-weight: 700;
                  line-height: 1.2;
              }
              .content {
                  padding: 25px 30px;
                  line-height: 1.6;
              }
              .content h2 {
                  font-size: 22px;
                  color: #333;
                  margin-top: 25px;
                  margin-bottom: 15px;
                  font-weight: 600;
              }
              .content p {
                  margin: 0 0 12px;
              }
              .content strong {
                  color: #1a1a1a;
              }
              .order-details {
                  background-color: #f9f9f9;
                  border-radius: 8px;
                  padding: 20px;
                  margin-bottom: 25px;
                  border: 1px solid #eee;
              }
              .order-details p {
                  display: flex;
                  justify-content: space-between;
                  margin: 8px 0;
                  font-size: 15px;
              }
              .order-details p strong {
                  flex-basis: 40%;
                  text-align: left;
                  color: #555;
              }
              .order-details p span {
                  flex-basis: 60%;
                  text-align: right;
                  color: #333;
              }
              .order-details table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
              }
              .order-details th, .order-details td {
                  padding: 12px;
                  border-bottom: 1px solid #e0e0e0;
                  text-align: left;
                  font-size: 14px;
              }
              .order-details th {
                  background-color: #eef4ee; /* Lighter green tint */
                  font-weight: 600;
                  color: #4CAF50;
              }
              .order-details tbody tr:last-child td {
                  border-bottom: none;
              }
              .order-summary {
                  background-color: #e8f5e9; /* Even lighter green */
                  border-radius: 8px;
                  padding: 20px;
                  margin-top: 25px;
                  border: 1px solid #dcdcdc;
              }
              .order-summary p {
                  display: flex;
                  justify-content: space-between;
                  margin: 10px 0;
                  font-size: 17px;
              }
              .order-summary .total {
                  font-size: 24px;
                  font-weight: 700;
                  color: #28a745;
                  border-top: 1px solid #dcdcdc;
                  padding-top: 15px;
                  margin-top: 15px;
              }
              .footer {
                  text-align: center;
                  padding: 25px 30px;
                  border-top: 1px solid #eee;
                  color: #888;
                  font-size: 13px;
                  background-color: #f4f4f4;
                  border-bottom-left-radius: 12px;
                  border-bottom-right-radius: 12px;
              }
              .button {
                  display: inline-block;
                  background-color: #4CAF50;
                  color: #ffffff;
                  padding: 12px 25px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-weight: 600;
                  margin-top: 20px;
              }
              @media only screen and (max-width: 600px) {
                  .container {
                      margin: 0;
                      border-radius: 0;
                      box-shadow: none;
                  }
                  .content, .footer {
                      padding: 20px;
                  }
                  .header h1 {
                      font-size: 24px;
                  }
                  .order-details p, .order-summary p {
                      flex-direction: column;
                      align-items: flex-start;
                  }
                  .order-details p span, .order-details p strong {
                      text-align: left;
                      width: 100%;
                  }
                  .order-details table th, .order-details table td {
                      padding: 10px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  ${absoluteRestaurantLogo ? `<img src="${absoluteRestaurantLogo}" alt="${restaurantName} Logo">` : ""}
                  <h1>Thank you for your order!</h1>
                  <p style="color: #ffffff; font-size: 18px; margin-top: 10px;">Order #${orderId}</p>
              </div>
              <div class="content">
                  <p>Dear Customer,</p>
                  <p>Your order at <strong>${restaurantName}</strong> has been successfully placed and confirmed. We're excited to prepare your delicious meal!</p>
                  
                  <h2>Order Summary</h2>
                  <div class="order-details">
                      <p><strong>Order ID:</strong> <span>${orderId}</span></p>
                      <p><strong>Restaurant:</strong> <span>${restaurantName}</span></p>
                      <p><strong>Table Number:</strong> <span>${tableNumber}</span></p>
                      <p><strong>Order Time:</strong> <span>${orderTime}</span></p>
                      <p><strong>Payment Method:</strong> <span>${paymentMethod}</span></p>
                      <p><strong>Payment Status:</strong> <span>${paymentStatus}</span></p>

                      <h3>Items Ordered:</h3>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <thead>
                              <tr>
                                  <th>Item</th>
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
                      <p><span>Subtotal:</span> <span>GH₵${totalAmount.toFixed(2)}</span></p>
                      <p><span>Tax:</span> <span>GH₵0.00</span></p>
                      <p class="total"><span>Total Amount:</span> <span>GH₵${totalAmount.toFixed(2)}</span></p>
                  </div>

                  <p>We will send another update when your order is ready. If you have any questions, please feel free to contact us.</p>
                  <p>Enjoy your meal!</p>
                  <p style="text-align: center;">
                    <a href="${req.nextUrl.origin}/track-order/${orderId}" class="button">Track Your Order</a>
                  </p>
              </div>
              <div class="footer">
                  <p>Thank you for choosing ${restaurantName}.</p>
                  <p>&copy; ${new Date().getFullYear()} ${restaurantName}. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    console.log("Generated Email HTML:", emailHtml); // Debugging log

    const { data, error } = await resend.emails.send({
    from: "ChefFlow <onboarding@resend.dev>",// IMPORTANT: Replace this with an email address on the domain you verified with Resend.
      to: [to],
      subject: `Your ChefFlow Order Confirmation - #${orderId}`,
      html: emailHtml,
    });

    // TODO: For production, replace 'onboarding@resend.dev' with an email from your verified domain (e.g., 'orders@yourdomain.com').
    // Images linked in emails (especially from unverified domains or if the email lands in spam) might be blocked by email clients.
    // Ensure all image URLs are publicly accessible (not localhost) and ideally served over HTTPS.
    // Verify your domain with Resend to improve deliverability and reduce spam flagging.

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
