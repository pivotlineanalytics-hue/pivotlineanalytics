const { EmailClient } = require("@azure/communication-email");

module.exports = async function (context, req) {
    try {
        const { name, email, company, message } = req.body;

        if (!name || !email || !message) {
            context.res = {
                status: 400,
                body: { error: "Missing required fields" }
            };
            return;
        }

        const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION;
        const emailClient = new EmailClient(connectionString);

        const emailMessage = {
            senderAddress: "DoNotReply@<YOUR-ACS-DOMAIN>.azurecomm.net",
            content: {
                subject: "New Contact Form Submission",
                plainText: `
Name: ${name}
Email: ${email}
Company: ${company || "(none)"}

Message:
${message}
                `,
                html: `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Company:</strong> ${company || "(none)"}</p>
                    <p><strong>Message:</strong><br>${message}</p>
                `
            },
            recipients: {
                to: [
                    { address: "adglinn@pivotlineanalytics.com" }
                ]
            }
        };

        const poller = await emailClient.beginSend(emailMessage);
        const response = await poller.pollUntilDone();

        context.res = {
            status: 200,
            body: { success: true, message: "Email sent successfully!" }
        };

    } catch (err) {
        context.res = {
            status: 500,
            body: { error: err.message }
        };
    }
};
