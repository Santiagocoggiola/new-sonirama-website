using FluentValidation;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders.Validators;

public sealed class OrderListRequestValidator : AbstractValidator<OrderListRequest>
{
    public OrderListRequestValidator()
    {
        RuleFor(x => x.Page).GreaterThan(0);
        RuleFor(x => x.PageSize).GreaterThan(0).LessThanOrEqualTo(100);
        RuleFor(x => x.Query).MaximumLength(100);
        RuleFor(x => x.SortDir).Must(BeValidSortDir).WithMessage("SortDir debe ser ASC o DESC");
    }

    private static bool BeValidSortDir(string? value)
        => string.IsNullOrWhiteSpace(value) || value.Equals("ASC", StringComparison.OrdinalIgnoreCase) || value.Equals("DESC", StringComparison.OrdinalIgnoreCase);
}
