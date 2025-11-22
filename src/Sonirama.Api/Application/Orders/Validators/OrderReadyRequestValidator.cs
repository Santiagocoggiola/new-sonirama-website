using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderReadyRequestValidator : AbstractValidator<OrderReadyRequest>
{
    public OrderReadyRequestValidator()
    {
        RuleFor(x => x.ReadyNotes)
            .MaximumLength(1000);
    }
}
