using FluentValidation;
using Sonirama.Api.Application.Contact.Dtos;

namespace Sonirama.Api.Application.Contact.Validators;

public sealed class ContactRequestValidator : AbstractValidator<ContactRequest>
{
    public ContactRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre no puede superar los 100 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El email es obligatorio.")
            .EmailAddress().WithMessage("El email no tiene un formato válido.")
            .MaximumLength(255).WithMessage("El email no puede superar los 255 caracteres.");

        RuleFor(x => x.Subject)
            .MaximumLength(200).WithMessage("El asunto no puede superar los 200 caracteres.");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("El mensaje es obligatorio.")
            .MinimumLength(10).WithMessage("El mensaje debe tener al menos 10 caracteres.")
            .MaximumLength(5000).WithMessage("El mensaje no puede superar los 5000 caracteres.");
    }
}
