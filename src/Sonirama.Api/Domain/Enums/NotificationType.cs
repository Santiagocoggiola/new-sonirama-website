namespace Sonirama.Api.Domain.Enums;

/// <summary>
/// Types of notifications that can be sent to users.
/// </summary>
public enum NotificationType
{
    /// <summary>A new order was created</summary>
    OrderCreated = 0,
    
    /// <summary>Order status changed</summary>
    OrderStatusChanged = 1,
    
    /// <summary>Order was approved by admin</summary>
    OrderApproved = 2,
    
    /// <summary>Order was rejected by admin</summary>
    OrderRejected = 3,
    
    /// <summary>Order is ready for pickup</summary>
    OrderReady = 4,
    
    /// <summary>Order was completed</summary>
    OrderCompleted = 5,
    
    /// <summary>Order was cancelled</summary>
    OrderCancelled = 6,
    
    /// <summary>Product price changed</summary>
    PriceChanged = 7,
    
    /// <summary>New product available</summary>
    NewProduct = 8,
    
    /// <summary>Password was reset</summary>
    PasswordReset = 9,
    
    /// <summary>Account created</summary>
    AccountCreated = 10,
    
    /// <summary>General system notification</summary>
    System = 99
}
