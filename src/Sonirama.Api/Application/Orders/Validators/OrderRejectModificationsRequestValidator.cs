using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderRejectModificationsRequestValidator : AbstractValidator<OrderRejectModificationsRequest>
{
    public OrderRejectModificationsRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("El motivo del rechazo es obligatorio.")
            .MaximumLength(1000).WithMessage("El motivo no puede superar los 1000 caracteres.");
    }
}
