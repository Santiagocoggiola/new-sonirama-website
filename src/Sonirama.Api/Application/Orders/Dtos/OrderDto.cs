using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Application.Orders.Dtos;

public sealed class OrderDto
{
    public Guid Id { get; set; }
    public string Number { get; set; } = default!;
    public string OrderNumber => Number;
    public OrderStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public Guid UserId { get; set; }
    public string? UserPhoneNumber { get; set; }
    public decimal UserDiscountPercent { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal BulkDiscountAmount => DiscountTotal;
    public decimal Total { get; set; }
    public string Currency { get; set; } = "ARS";
    public string? UserNotes { get; set; }
    public string? AdminNotes { get; set; }
    public string? RejectionReason { get; set; }
    public string? CancellationReason { get; set; }
    
    /// <summary>Reason for modification by admin</summary>
    public string? ModificationReason { get; set; }
    
    /// <summary>Original total before modification</summary>
    public decimal? OriginalTotal { get; set; }
    
    /// <summary>When the order was modified</summary>
    public DateTime? ModifiedAtUtc { get; set; }
    
    /// <summary>Whether this order has pending modifications to review</summary>
    public bool HasPendingModifications => Status == OrderStatus.ModificationPending;
    
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? ApprovedAtUtc { get; set; }
    public DateTime? RejectedAtUtc { get; set; }
    public DateTime? ConfirmedAtUtc { get; set; }
    public DateTime? ReadyAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }
    public IReadOnlyCollection<OrderItemDto> Items { get; set; } = Array.Empty<OrderItemDto>();
}
