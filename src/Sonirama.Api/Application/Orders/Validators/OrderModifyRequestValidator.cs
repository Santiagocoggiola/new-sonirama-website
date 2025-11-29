using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderModifyRequestValidator : AbstractValidator<OrderModifyRequest>
{
    public OrderModifyRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("El motivo de la modificación es obligatorio.")
            .MaximumLength(1000).WithMessage("El motivo no puede superar los 1000 caracteres.");

        RuleFor(x => x.AdminNotes)
            .MaximumLength(2000).WithMessage("Las notas del admin no pueden superar los 2000 caracteres.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Debés indicar al menos un item a modificar.")
            .Must(items => items.Count <= 100).WithMessage("No podés modificar más de 100 items a la vez.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId)
                .NotEmpty().WithMessage("El ID del producto es obligatorio.");

            item.RuleFor(i => i.NewQuantity)
                .GreaterThanOrEqualTo(0).WithMessage("La cantidad no puede ser negativa.");
        });
    }
}
