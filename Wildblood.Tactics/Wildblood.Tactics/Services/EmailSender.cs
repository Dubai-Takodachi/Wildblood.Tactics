namespace Wildblood.Tactics.Services;

using Azure.Core;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Threading.Tasks;
using Wildblood.Tactics.Data;

public class EmailSender : IEmailSender<ApplicationUser>
{
    private readonly ILogger _logger;
    private readonly string smtpServer = "mxe9ad.netcup.net";
    private readonly int smtpPort = 465; // oder 465 für SSL
    private readonly string smtpUser = "no-reply@wildblood-tactics.de";
    private readonly string smtpPass = "0u!D685lp";

    public async Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Wildblood Tactics", smtpUser));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Confirm your Email.";

        message.Body = new TextPart("plain") { Text = confirmationLink };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtpServer, smtpPort, SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(smtpUser, smtpPass);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Wildblood Tactics", smtpUser));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = subject;

        message.Body = new TextPart("plain") { Text = htmlMessage };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtpServer, smtpPort, SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(smtpUser, smtpPass);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Wildblood Tactics", smtpUser));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Confirm your Email.";

        message.Body = new TextPart("plain") { Text = resetCode };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtpServer, smtpPort, SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(smtpUser, smtpPass);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Wildblood Tactics", smtpUser));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Confirm your Email.";

        message.Body = new TextPart("plain") { Text = resetLink };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtpServer, smtpPort, SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(smtpUser, smtpPass);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
