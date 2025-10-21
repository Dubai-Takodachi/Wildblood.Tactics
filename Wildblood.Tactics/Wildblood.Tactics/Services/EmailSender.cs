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
    private readonly EmailSettings _emailSettings;

    public EmailSender(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
    }

    public async Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.SmtpUser));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Confirm your Email.";

        message.Body = new TextPart("plain") { Text = confirmationLink };

        using var client = new SmtpClient();
        await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(_emailSettings.SmtpUser, _emailSettings.SmtpPassword);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.SmtpUser));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = subject;

        message.Body = new TextPart("plain") { Text = htmlMessage };

        using var client = new SmtpClient();
        await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(_emailSettings.SmtpUser, _emailSettings.SmtpPassword);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.SmtpUser));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Confirm your Email.";

        message.Body = new TextPart("plain") { Text = resetCode };

        using var client = new SmtpClient();
        await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(_emailSettings.SmtpUser, _emailSettings.SmtpPassword);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.SmtpUser));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Confirm your Email.";

        message.Body = new TextPart("plain") { Text = resetLink };

        using var client = new SmtpClient();
        await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, SecureSocketOptions.SslOnConnect);
        await client.AuthenticateAsync(_emailSettings.SmtpUser, _emailSettings.SmtpPassword);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
