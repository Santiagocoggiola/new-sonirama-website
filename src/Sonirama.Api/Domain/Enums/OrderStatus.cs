namespace Sonirama.Api.Domain.Enums;

public enum OrderStatus
{
    /// <summary>Order awaiting admin approval</summary>
    PendingApproval = 0,
    
    /// <summary>Order approved by admin, waiting for user confirmation</summary>
    Approved = 1,
    
    /// <summary>Order rejected by admin</summary>
    Rejected = 2,
    
    /// <summary>Order modified by admin, waiting for user to accept/reject changes</summary>
    ModificationPending = 3,
    
    /// <summary>Order confirmed by user</summary>
    Confirmed = 4,
    
    /// <summary>Order ready for pickup/delivery</summary>
    ReadyForPickup = 5,
    
    /// <summary>Order completed (delivered/picked up)</summary>
    Completed = 6,
    
    /// <summary>Order cancelled by user</summary>
    Cancelled = 7
}
