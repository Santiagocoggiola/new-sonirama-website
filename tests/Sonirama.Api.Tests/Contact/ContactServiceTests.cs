using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Contact;
using Sonirama.Api.Application.Contact.Dtos;
using Xunit;

namespace Sonirama.Api.Tests.Contact;

public class ContactServiceTests
{
    private readonly Mock<IEmailSender> _emailSender = new();
    private readonly Mock<ILogger<ContactService>> _logger = new();
    private readonly ContactOptions _options = new()
    {
        DestinationEmail = "contacto@sonirama.com",
        DestinationName = "Sonirama Contacto",
        SubjectPrefix = "[Test]",
        Enabled = true
    };

    private ContactService CreateService(ContactOptions? options = null)
    {
        var opts = Options.Create(options ?? _options);
        return new ContactService(_emailSender.Object, opts, _logger.Object);
    }

    [Fact]
    public async Task SendMessageAsync_ShouldSucceed_WhenConfigured()
    {
        var service = CreateService();
        var request = new ContactRequest
        {
            Name = "Juan Pérez",
            Email = "juan@test.com",
            Subject = "Consulta",
            Message = "Este es un mensaje de prueba para el sistema de contacto."
        };

        _emailSender
            .Setup(e => e.SendAsync(
                _options.DestinationEmail, 
                It.IsAny<string>(), 
                It.IsAny<string>(), 
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await service.SendMessageAsync(request, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Message.Should().Contain("enviado correctamente");
        _emailSender.Verify(e => e.SendAsync(
            _options.DestinationEmail,
            It.Is<string>(s => s.Contains("[Test]") && s.Contains("Consulta")),
            It.Is<string>(b => b.Contains("Juan Pérez") && b.Contains("juan@test.com")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SendMessageAsync_ShouldFail_WhenDisabled()
    {
        var options = new ContactOptions { Enabled = false };
        var service = CreateService(options);
        var request = new ContactRequest
        {
            Name = "Test",
            Email = "test@test.com",
            Message = "Mensaje de prueba"
        };

        var result = await service.SendMessageAsync(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("no está disponible");
        _emailSender.Verify(e => e.SendAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), 
            Times.Never);
    }

    [Fact]
    public async Task SendMessageAsync_ShouldFail_WhenNoDestinationEmail()
    {
        var options = new ContactOptions 
        { 
            Enabled = true, 
            DestinationEmail = "" 
        };
        var service = CreateService(options);
        var request = new ContactRequest
        {
            Name = "Test",
            Email = "test@test.com",
            Message = "Mensaje de prueba"
        };

        var result = await service.SendMessageAsync(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("no está configurado");
    }

    [Fact]
    public async Task SendMessageAsync_ShouldFail_WhenEmailSenderThrows()
    {
        var service = CreateService();
        var request = new ContactRequest
        {
            Name = "Test",
            Email = "test@test.com",
            Message = "Mensaje de prueba"
        };

        _emailSender
            .Setup(e => e.SendAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("SMTP error"));

        var result = await service.SendMessageAsync(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("error al enviar");
    }

    [Fact]
    public async Task SendMessageAsync_ShouldUseDefaultSubject_WhenNotProvided()
    {
        var service = CreateService();
        var request = new ContactRequest
        {
            Name = "Test",
            Email = "test@test.com",
            Subject = null,
            Message = "Mensaje sin asunto específico"
        };

        _emailSender
            .Setup(e => e.SendAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await service.SendMessageAsync(request, CancellationToken.None);

        result.Success.Should().BeTrue();
        _emailSender.Verify(e => e.SendAsync(
            It.IsAny<string>(),
            It.Is<string>(s => s.Contains("Nuevo mensaje")),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
