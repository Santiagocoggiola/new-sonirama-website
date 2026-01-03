using FluentValidation;
using Sonirama.Api.Application.Users.Dtos;

namespace Sonirama.Api.Application.Users.Validation;

// Validator for current user profile updates.
public sealed class UserProfileUpdateRequestValidator : AbstractValidator<UserProfileUpdateRequest>
{
    public UserProfileUpdateRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName)
            .NotEmpty().MaximumLength(100);
        RuleFor(x => x.PhoneNumber)
            .MaximumLength(32).When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));
    }
}
