namespace Sonirama.Api.Domain.Enums;

public enum OrderStatus
{
    PendingApproval = 0,
    Approved = 1,
    Rejected = 2,
    Confirmed = 3,
    ReadyForPickup = 4,
    Completed = 5,
    Cancelled = 6
}
