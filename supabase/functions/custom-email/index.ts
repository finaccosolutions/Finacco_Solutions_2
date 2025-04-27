import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, email, data } = await req.json();

    if (type === 'signup') {
      // Extract the code from the confirmation URL
      const url = new URL(data.confirmation_url);
      const code = url.searchParams.get('token');
      
      // Create new confirmation URL with our custom route
      const confirmationUrl = `${url.origin}/auth/callback?code=${code}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Finacco Solutions</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.5;
              padding: 2rem;
              max-width: 600px;
              margin: 0 auto;
              color: #1a1a1a;
              background-color: #f3f4f6;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 2rem;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .logo {
              text-align: center;
              margin-bottom: 2rem;
            }
            .logo-text {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: linear-gradient(to right, #2563eb, #7c3aed);
              color: white !important;
              text-decoration: none !important;
              border-radius: 6px;
              font-weight: 600;
              margin: 1rem 0;
              text-align: center;
            }
            .footer {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #e5e7eb;
              font-size: 0.875rem;
              color: #666;
              text-align: center;
            }
            .confirmation-url {
              word-break: break-all;
              color: #2563eb;
              margin: 1rem 0;
              padding: 1rem;
              background-color: #f3f4f6;
              border-radius: 4px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <div class="logo-text">Finacco Solutions</div>
            </div>
            
            <h1 style="color: #2563eb; margin-bottom: 1rem; text-align: center;">Welcome!</h1>
            
            <p style="font-size: 16px; color: #374151; text-align: center;">
              Thank you for signing up with Finacco Solutions. To get started, please confirm your email address.
            </p>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${confirmationUrl}" class="button" style="color: white !important; text-decoration: none !important;">
                Confirm Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; text-align: center;">
              Or copy and paste this URL into your browser:
            </p>
            
            <div class="confirmation-url">
              ${confirmationUrl}
            </div>
            
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} Finacco Solutions. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      return new Response(
        JSON.stringify({ html }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unsupported email type' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});