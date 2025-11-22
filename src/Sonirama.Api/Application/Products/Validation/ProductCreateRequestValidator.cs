using FluentValidation;
using Sonirama.Api.Application.Products.Dtos;

namespace Sonirama.Api.Application.Products.Validation;

// FluentValidation rules for creating products.
public sealed class ProductCreateRequestValidator : AbstractValidator<ProductCreateRequest>
{
    public ProductCreateRequestValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Price).GreaterThan(0m).LessThan(100000000m);
        RuleFor(x => x.Currency).NotEmpty().Length(3);
        RuleFor(x => x.Category).MaximumLength(100);
    }
}
