using FluentValidation;
using Sonirama.Api.Application.Categories.Dtos;

namespace Sonirama.Api.Application.Categories.Validators;

// FluentValidation validator for Category creation.
public sealed class CategoryCreateRequestValidator : AbstractValidator<CategoryCreateRequest>
{
    public CategoryCreateRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug)
            .MaximumLength(200)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug inválido (solo minúsculas, números y guiones).")
            .When(x => !string.IsNullOrWhiteSpace(x.Slug));
        RuleFor(x => x.Description).MaximumLength(1000);
    }
}
