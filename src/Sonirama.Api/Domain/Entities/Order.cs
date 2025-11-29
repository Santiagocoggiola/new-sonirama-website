using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Domain.Entities;

public sealed class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Number { get; set; } = default!;
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.PendingApproval;
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal Total { get; set; }
    public string Currency { get; set; } = "ARS";
    public string? UserNotes { get; set; }
    public string? AdminNotes { get; set; }
    public string? RejectionReason { get; set; }
    public string? CancellationReason { get; set; }
    
    /// <summary>Reason for modification by admin</summary>
    public string? ModificationReason { get; set; }
    
    /// <summary>Admin who modified the order</summary>
    public Guid? ModifiedByUserId { get; set; }
    
    /// <summary>When the order was modified by admin</summary>
    public DateTime? ModifiedAtUtc { get; set; }
    
    /// <summary>Original total before modification (for comparison)</summary>
    public decimal? OriginalTotal { get; set; }
    
    public Guid? ApprovedByUserId { get; set; }
    public Guid? RejectedByUserId { get; set; }
    public Guid? ReadyByUserId { get; set; }
    public Guid? CompletedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAtUtc { get; set; }
    public DateTime? RejectedAtUtc { get; set; }
    public DateTime? ConfirmedAtUtc { get; set; }
    public DateTime? ReadyAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
