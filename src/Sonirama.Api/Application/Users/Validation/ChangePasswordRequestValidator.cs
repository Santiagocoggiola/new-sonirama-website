using FluentValidation;
using Sonirama.Api.Application.Users.Dtos;

namespace Sonirama.Api.Application.Users.Validation;

// Validator for self-service password change.
public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty();
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128);
    }
}
