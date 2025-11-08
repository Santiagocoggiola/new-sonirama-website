using FluentValidation;
using Sonirama.Api.Application.Users.Dtos;
using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Application.Users.Validation;

// FluentValidation validator for creating users.
public sealed class UserCreateRequestValidator : AbstractValidator<UserCreateRequest>
{
    public UserCreateRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.FirstName)
            .NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName)
            .NotEmpty().MaximumLength(100);
        RuleFor(x => x.PhoneNumber)
            .MaximumLength(32).When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));
        RuleFor(x => x.Role)
            .Must(Role.IsValid).WithMessage("Invalid role.");
    }
}
