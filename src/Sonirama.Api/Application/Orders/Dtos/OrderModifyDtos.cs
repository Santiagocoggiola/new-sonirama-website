namespace Sonirama.Api.Application.Orders.Dtos;

/// <summary>
/// Request to modify order items by admin.
/// </summary>
public sealed class OrderModifyRequest
{
    /// <summary>Reason for modification (e.g., "Stock insuficiente")</summary>
    public string Reason { get; set; } = default!;
    
    /// <summary>Optional admin notes</summary>
    public string? AdminNotes { get; set; }
    
    /// <summary>Modified items (only include items that changed)</summary>
    public List<OrderItemModification> Items { get; set; } = new();
}

/// <summary>
/// Single item modification.
/// </summary>
public sealed class OrderItemModification
{
    /// <summary>Product ID to modify</summary>
    public Guid ProductId { get; set; }
    
    /// <summary>New quantity (0 to remove item)</summary>
    public int NewQuantity { get; set; }
}

/// <summary>
/// Request to accept modifications made by admin.
/// </summary>
public sealed class OrderAcceptModificationsRequest
{
    /// <summary>Optional user note</summary>
    public string? Note { get; set; }
}

/// <summary>
/// Request to reject modifications made by admin.
/// </summary>
public sealed class OrderRejectModificationsRequest
{
    /// <summary>Reason for rejecting the modifications</summary>
    public string Reason { get; set; } = default!;
}
