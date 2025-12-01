// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
   
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  
        }
    });

    transporter.verify(function (error, success) {
        if (error) {
            console.log("Sunucu Bağlantı Hatası:", error);
        } else {
            console.log("Sunucu hazır, mesaj gönderilebilir.");
        }
    });

  
    const mailOptions = {
        from: `GlowSphere Support <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
      
    };

    await transporter.sendMail(mailOptions);

  
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;