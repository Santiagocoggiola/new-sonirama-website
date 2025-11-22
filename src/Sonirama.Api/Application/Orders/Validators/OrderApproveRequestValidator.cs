using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderApproveRequestValidator : AbstractValidator<OrderApproveRequest>
{
    public OrderApproveRequestValidator()
    {
        RuleFor(x => x.AdminNotes)
            .MaximumLength(2000);
    }
}
