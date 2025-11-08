using FluentValidation;
using Sonirama.Api.Application.Users.Dtos;
using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Application.Users.Validation;

// FluentValidation validator for updating users.
public sealed class UserUpdateRequestValidator : AbstractValidator<UserUpdateRequest>
{
    public UserUpdateRequestValidator()
    {
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
