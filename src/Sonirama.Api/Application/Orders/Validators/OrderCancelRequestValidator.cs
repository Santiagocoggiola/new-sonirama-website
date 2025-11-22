using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderCancelRequestValidator : AbstractValidator<OrderCancelRequest>
{
    public OrderCancelRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .MaximumLength(1000);
    }
}
