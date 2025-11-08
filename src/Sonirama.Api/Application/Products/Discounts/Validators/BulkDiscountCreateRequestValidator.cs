using FluentValidation;
using Sonirama.Api.Application.Products.Discounts.Dtos;

namespace Sonirama.Api.Application.Products.Discounts.Validators;

public sealed class BulkDiscountCreateRequestValidator : AbstractValidator<BulkDiscountCreateRequest>
{
    public BulkDiscountCreateRequestValidator()
    {
        RuleFor(x => x.MinQuantity).GreaterThan(0);
        RuleFor(x => x.DiscountPercent).GreaterThan(0).LessThanOrEqualTo(100);
        RuleFor(x => x.EndsAt)
            .Must((req, ends) => ends == null || req.StartsAt == null || ends >= req.StartsAt)
            .WithMessage("La fecha de fin debe ser posterior o igual a la fecha de inicio.");
    }
}
