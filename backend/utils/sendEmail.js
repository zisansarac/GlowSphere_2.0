const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        },
    
        family: 4 
    });

    transporter.verify((error, success) => {
        if (error) {
            console.error("SMTP Bağlantı Hatası:", error);
        } else {
            console.log("SMTP Sunucusu Hazır ve Bağlı! 🚀");
        }
    });

    const mailOptions = {
        from: `GlowSphere Support <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;