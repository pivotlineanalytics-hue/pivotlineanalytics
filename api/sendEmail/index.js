const nodemailer = require("nodemailer");

module.exports = async function (context, req) {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
        context.res = {
            status: 400,
            body: "Missing required fields."
        };
        return;
    }

    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.office365.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: `"Pivot Line Website" <${process.env.SMTP_USER}>`,
            to: "alex@pivotlineanalytics.com",
            subject: "New Contact Form Submission",
            html: `
                <h3>New Contact Form Submission</h3>
                <strong>Name:</strong> ${name}<br>
                <strong>Email:</strong> ${email}<br><br>
                <strong>Message:</strong><br>
                ${message}
            `
        });

        context.res = {
            status: 200,
            body: "Message sent."
        };

    } catch (err) {
        context.log("SMTP error:", err);
        context.res = {
            status: 500,
            body: "Email failed."
        };
    }
};
