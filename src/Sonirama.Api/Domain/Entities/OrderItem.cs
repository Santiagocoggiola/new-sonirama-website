namespace Sonirama.Api.Domain.Entities;

public sealed class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = default!;
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = default!;
    public string ProductName { get; set; } = default!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal UnitPriceWithDiscount { get; set; }
    public decimal LineTotal { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
