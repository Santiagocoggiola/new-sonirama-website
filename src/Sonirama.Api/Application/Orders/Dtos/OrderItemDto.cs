namespace Sonirama.Api.Application.Orders.Dtos;

public sealed class OrderItemDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = default!;
    public string ProductName { get; set; } = default!;
    public int Quantity { get; set; }
    public int? OriginalQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal UnitPriceWithDiscount { get; set; }
    public decimal LineTotal { get; set; }
    
    /// <summary>
    /// Indicates if the quantity was modified by admin
    /// </summary>
    public bool WasModified => OriginalQuantity.HasValue && OriginalQuantity != Quantity;
}
