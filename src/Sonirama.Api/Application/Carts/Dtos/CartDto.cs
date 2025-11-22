namespace Sonirama.Api.Application.Carts.Dtos;

public sealed class CartDto
{
    public Guid Id { get; set; }
    public IReadOnlyCollection<CartItemDto> Items { get; set; } = Array.Empty<CartItemDto>();
    public decimal Total { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
