using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderConfirmRequestValidator : AbstractValidator<OrderConfirmRequest>
{
    public OrderConfirmRequestValidator()
    {
        RuleFor(x => x.Note)
            .MaximumLength(1000);
    }
}
