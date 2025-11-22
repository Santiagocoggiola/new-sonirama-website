using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderCompleteRequestValidator : AbstractValidator<OrderCompleteRequest>
{
    public OrderCompleteRequestValidator()
    {
        RuleFor(x => x.CompletionNotes)
            .MaximumLength(1000);
    }
}
