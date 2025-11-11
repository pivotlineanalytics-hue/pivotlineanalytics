const { EmailClient } = require("@azure/communication-email");

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
        const connectionString = process.env.AzureCommunicationServicesConnectionString;
        const sender = process.env.senderEmailAddress;
        const recipient = process.env.myEmailAddress;

        const client = new EmailClient(connectionString);

        const emailMessage = {
            senderAddress: sender,
            recipients: {
                to: [
                    { address: recipient }
                ]
            },
            content: {
                subject: "New Contact Form Submission",
                html: `
                    <h3>New Contact Submission</h3>
                    <strong>Name:</strong> ${name}<br/>
                    <strong>Email:</strong> ${email}<br/><br/>
                    <strong>Message:</strong><br/>
                    ${message}
                `
            }
        };

        await client.send(emailMessage);

        context.res = {
            status: 200,
            body: "Message sent successfully."
        };

    } catch (err) {
        context.log.error("ACS Email Error: ", err);
        context.res = {
            status: 500,
            body: "Failed to send email."
        };
    }
};
