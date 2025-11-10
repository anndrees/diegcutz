import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  clientName: string;
  clientContact: string;
  bookingDate: string;
  bookingTime: string;
  services: string[];
  totalPrice: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientContact, bookingDate, bookingTime, services, totalPrice }: BookingEmailRequest = await req.json();

    console.log("Sending booking notification email for:", { clientName, bookingDate, bookingTime, totalPrice });

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "DIEGCUTZ <onboarding@resend.dev>",
        to: ["anndrees31@gmail.com"],
        subject: `🔥 Nueva Reserva - ${clientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #00ffff; text-align: center;">🔥 NUEVA RESERVA</h1>
            <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; border: 2px solid #00ffff;">
              <h2 style="color: #fff; margin-top: 0;">Detalles de la Reserva:</h2>
              <p style="color: #fff; font-size: 16px;">
                <strong style="color: #00ffff;">Cliente:</strong> ${clientName}<br>
                <strong style="color: #00ffff;">Contacto:</strong> ${clientContact}<br>
                <strong style="color: #00ffff;">Fecha:</strong> ${new Date(bookingDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}<br>
                <strong style="color: #00ffff;">Hora:</strong> ${bookingTime}<br>
                <strong style="color: #00ffff;">Servicios:</strong><br>
                ${services.map(s => `&nbsp;&nbsp;• ${s}`).join('<br>')}<br>
                <strong style="color: #00ffff;">TOTAL:</strong> <span style="font-size: 20px; color: #ff00ff;">${totalPrice}€</span>
              </p>
            </div>
            <p style="color: #666; text-align: center; margin-top: 20px; font-size: 14px;">
              DIEGCUTZ - Carrer Sant Antoni, Monóvar, Alicante
            </p>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
