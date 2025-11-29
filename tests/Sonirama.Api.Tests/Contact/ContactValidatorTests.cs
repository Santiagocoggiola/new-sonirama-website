using FluentAssertions;
using Sonirama.Api.Application.Contact.Dtos;
using Sonirama.Api.Application.Contact.Validators;
using Xunit;

namespace Sonirama.Api.Tests.Contact;

public class ContactValidatorTests
{
    private readonly ContactRequestValidator _validator = new();

    [Fact]
    public void Should_Pass_WhenValidRequest()
    {
        var request = new ContactRequest
        {
            Name = "Juan Pérez",
            Email = "juan@example.com",
            Subject = "Consulta",
            Message = "Este es un mensaje de prueba válido."
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Pass_WhenNoSubject()
    {
        var request = new ContactRequest
        {
            Name = "Juan Pérez",
            Email = "juan@example.com",
            Subject = null,
            Message = "Este es un mensaje válido sin asunto."
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Fail_WhenNameIsEmpty()
    {
        var request = new ContactRequest
        {
            Name = "",
            Email = "test@example.com",
            Message = "Mensaje válido de prueba"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void Should_Fail_WhenEmailIsInvalid()
    {
        var request = new ContactRequest
        {
            Name = "Test",
            Email = "not-an-email",
            Message = "Mensaje válido de prueba"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Fact]
    public void Should_Fail_WhenMessageIsTooShort()
    {
        var request = new ContactRequest
        {
            Name = "Test",
            Email = "test@example.com",
            Message = "Corto"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Message");
    }

    [Fact]
    public void Should_Fail_WhenMessageIsTooLong()
    {
        var request = new ContactRequest
        {
            Name = "Test",
            Email = "test@example.com",
            Message = new string('a', 5001)
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Message");
    }

    [Fact]
    public void Should_Fail_WhenNameIsTooLong()
    {
        var request = new ContactRequest
        {
            Name = new string('a', 101),
            Email = "test@example.com",
            Message = "Mensaje válido de prueba"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }
}
