using FluentValidation;
using Sonirama.Api.Application.Carts.Dtos;

namespace Sonirama.Api.Application.Carts.Validators;

public sealed class CartAddItemRequestValidator : AbstractValidator<CartAddItemRequest>
{
    public CartAddItemRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}
