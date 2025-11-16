const { EmailClient } = require("@azure/communication-email");

module.exports = async function (context, req) {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      context.res = {
        status: 400,
        body: { ok: false, error: "name, email, and message are required" }
      };
      return;
    }

    const connectionString = process.env.AzureCommunicationServicesConnectionString;
    const from = process.env.senderEmailAddress;   // donotreply@pivotlineanalytics.com
    const to = process.env.myEmailAddress;         // your personal inbox

    const emailClient = new EmailClient(connectionString);

    const subject = `Website contact from ${name}`;
    const plain = `New contact form submission

Name: ${name}
Email: ${email}

Message:
${message}
`;
    const html =
      `<h2>New contact form submission</h2>
       <p><strong>Name:</strong> ${name}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Message:</strong></p>
       <p>${String(message).replace(/\n/g, "<br/>")}</p>`;

    const poller = await emailClient.beginSend({
      senderAddress: from,
      recipients: { to: [{ address: to }] },
      content: { subject, plainText: plain, html },
      replyTo: [{ address: email, displayName: name }]
    });

    const result = await poller.pollUntilDone();
    if (result.error) throw new Error(result.error.message);

    context.res = { status: 200, body: { ok: true } };
  } catch (err) {
    context.log.error(err);
    context.res = {
      status: 500,
      body: { ok: false, error: err.message || "Internal Server Error" }
    };
  }
};
