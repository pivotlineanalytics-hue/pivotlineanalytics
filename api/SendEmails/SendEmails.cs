using System.IO;
using System.Threading.Tasks;
using Azure;
using Azure.Communication.Email;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;

public static class SendEmails
{
    [FunctionName("SendEmails")]
    public static async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = null)] HttpRequest req,
        ILogger log)
    {
        log.LogInformation("SendEmails Function Triggered.");

        string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
        dynamic data = JsonConvert.DeserializeObject(requestBody);

        string name = data?.name;
        string email = data?.email;
        string company = data?.company;
        string message = data?.message;

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(message))
            return new BadRequestObjectResult("Missing required fields.");

        if (message.Length > 5000)
            return new BadRequestObjectResult("Message too long.");

        var myEmailAddress = Environment.GetEnvironmentVariable("MY_EMAIL_ADDRESS");
        var senderEmailAddress = Environment.GetEnvironmentVariable("SENDER_EMAIL_ADDRESS");
        var acsConnectionString = Environment.GetEnvironmentVariable("ACS_CONNECTION_STRING");

        if (string.IsNullOrEmpty(myEmailAddress) || string.IsNullOrEmpty(senderEmailAddress) || string.IsNullOrEmpty(acsConnectionString))
        {
            log.LogError("Missing environment variables.");
            return new StatusCodeResult(StatusCodes.Status500InternalServerError);
        }

        var emailClient = new EmailClient(acsConnectionString);

        try
        {
            var adminHtml = $@"<html><body>
                <h3>New Lead</h3>
                <p><strong>Name:</strong> {System.Net.WebUtility.HtmlEncode(name)}</p>
                <p><strong>Email:</strong> {System.Net.WebUtility.HtmlEncode(email)}</p>
                {(string.IsNullOrWhiteSpace(company) ? "" : $"<p><strong>Company:</strong> {System.Net.WebUtility.HtmlEncode(company)}</p>")}
                <p><strong>Message:</strong><br/>{System.Net.WebUtility.HtmlEncode(message).Replace("\n","<br/>")}</p>
                </body></html>";

            await emailClient.SendAsync(
                Azure.WaitUntil.Completed,
                senderEmailAddress,
                myEmailAddress,
                $"New contact from {name}",
                adminHtml);

            var contactHtml = $@"<html><body>
                <p>Hi {System.Net.WebUtility.HtmlEncode(name)},</p>
                <p>Thanks for reaching out. We received your message and will reply within one business day.</p>
                <p>— Pivot Line Analytics</p>
                </body></html>";

            await emailClient.SendAsync(
                Azure.WaitUntil.Completed,
                senderEmailAddress,
                email,
                "Thanks for contacting Pivot Line Analytics",
                contactHtml);

            return new OkObjectResult(new { ok = true });
        }
        catch (Exception ex)
        {
            log.LogError(ex, "Email send failed.");
            return new StatusCodeResult(StatusCodes.Status500InternalServerError);
        }
    }
}
