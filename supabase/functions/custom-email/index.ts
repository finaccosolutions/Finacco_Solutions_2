import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Confirm Your Email</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.5;
              padding: 2rem;
              max-width: 600px;
              margin: 0 auto;
              color: #1a1a1a;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 2rem;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: linear-gradient(to right, #2563eb, #7c3aed);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 1rem 0;
            }
            .footer {
              margin-top: 2rem;
              font-size: 0.875rem;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="color: #2563eb; margin-bottom: 1rem;">Welcome to Finacco Solutions!</h1>
            <p>Thank you for signing up. Please confirm your email address to get started.</p>
            <a href="${data.confirmation_url}" class="button">Confirm Email Address</a>
            <p>Or copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${data.confirmation_url}</p>
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