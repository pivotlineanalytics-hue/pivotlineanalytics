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

        // Match your Static Web App environment variable names exactly:
        const connectionString = process.env.AzureCommunicationServicesConnectionString;
        const senderAddress = process.env.senderEmailAddress;
        const toAddress = process.env.myEmailAddress;

        if (!connectionString || !senderAddress || !toAddress) {
            context.log("Environment variables:", {
                connectionString: !!connectionString,
                senderAddress: !!senderAddress,
                toAddress: !!toAddress
            });

            context.res = {
                status: 500,
                body: { error: "Missing one or more required environment variables." }
            };
            return;
        }

        const emailClient = new EmailClient(connectionString);

        const emailMessage = {
            senderAddress,
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
                to: [{ address: toAddress }]
            }
        };

        const poller = await emailClient.beginSend(emailMessage);
        const result = await poller.pollUntilDone();

        context.res = {
            status: 200,
            body: { success: true, message: "Email sent successfully!" }
        };

    } catch (err) {
        context.log("ERROR sending email:", err);
        context.res = {
            status: 500,
            body: { error: err.message }
        };
    }
};
