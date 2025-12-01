const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com', 
        port: 587,
        secure: false, 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: `GlowSphere <${process.env.EMAIL_USER}>`, 
        to: options.email, 
        subject: options.subject,
        text: options.message,
        html: `<div style="font-family: sans-serif; padding: 20px;">
                <h2>GlowSphere Destek</h2>
                <p>${options.message.replace(/\n/g, '<br>')}</p>
               </div>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email gönderildi: %s", info.messageId);
    } catch (error) {
        console.error("Email Hatası:", error);
        throw new Error("Email gönderilemedi");
    }
};

module.exports = sendEmail;