

const sendEmail = async (options) => {
    const apiKey = process.env.EMAIL_PASS;  
    const senderEmail = process.env.EMAIL_USER; 

    const url = 'https://api.brevo.com/v3/smtp/email';

    const body = {
        sender: { name: 'GlowSphere', email: senderEmail },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #A7C080;">GlowSphere</h2>
                <p style="font-size: 16px;">${options.message.replace(/\n/g, '<br>')}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">Bu işlemi siz talep etmediyseniz, lütfen görmezden gelin.</p>
            </div>
        `
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Brevo API Hatası: ${errorData}`);
        }

        console.log("✅ Email başarıyla gönderildi (API)");

    } catch (error) {
        console.error("❌ Email Gönderme Hatası:", error.message);
        throw new Error("Email gönderilemedi.");
    }
};

module.exports = sendEmail;