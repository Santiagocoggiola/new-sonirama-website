using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderAcceptModificationsRequestValidator : AbstractValidator<OrderAcceptModificationsRequest>
{
    public OrderAcceptModificationsRequestValidator()
    {
        RuleFor(x => x.Note)
            .MaximumLength(1000).WithMessage("La nota no puede superar los 1000 caracteres.");
    }
}
