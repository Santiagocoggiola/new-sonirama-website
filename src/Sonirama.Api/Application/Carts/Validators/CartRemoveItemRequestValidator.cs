using FluentValidation;
using Sonirama.Api.Application.Carts.Dtos;

namespace Sonirama.Api.Application.Carts.Validators;

public sealed class CartRemoveItemRequestValidator : AbstractValidator<CartRemoveItemRequest>
{
    public CartRemoveItemRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity)
            .Must(q => !q.HasValue || q.Value > 0)
            .WithMessage("La cantidad debe ser mayor a cero cuando se especifica.");
    }
}
