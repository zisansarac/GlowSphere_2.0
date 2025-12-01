// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
   
    const transporter = nodemailer.createTransport({
        service: 'smtp.gmail', 
        port: 465, 
        secure: true,
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  
        },
        connectionTimeout: 10000
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