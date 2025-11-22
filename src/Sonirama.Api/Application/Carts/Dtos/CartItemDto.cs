namespace Sonirama.Api.Application.Carts.Dtos;

public sealed class CartItemDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPriceBase { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal UnitPriceWithDiscount { get; set; }
    public decimal LineTotal { get; set; }
    public int? MinBulkQuantityApplied { get; set; }
}
