using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderRejectRequestValidator : AbstractValidator<OrderRejectRequest>
{
    public OrderRejectRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .MaximumLength(1000);
    }
}
