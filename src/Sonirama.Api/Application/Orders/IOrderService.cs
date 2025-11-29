using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Orders;

public interface IOrderService
{
    Task<OrderDto> CreateFromCartAsync(Guid userId, CancellationToken ct);
    Task<OrderDto> GetByIdAsync(Guid orderId, Guid requesterId, bool requesterIsAdmin, CancellationToken ct);
    Task<PagedResult<OrderSummaryDto>> ListAsync(OrderListRequest request, Guid requesterId, bool requesterIsAdmin, CancellationToken ct);
    Task<OrderDto> ConfirmAsync(Guid orderId, Guid userId, OrderConfirmRequest? request, CancellationToken ct);
    Task<OrderDto> CancelAsync(Guid orderId, Guid userId, OrderCancelRequest request, CancellationToken ct);
    Task<OrderDto> ApproveAsync(Guid orderId, Guid adminUserId, OrderApproveRequest? request, CancellationToken ct);
    Task<OrderDto> RejectAsync(Guid orderId, Guid adminUserId, OrderRejectRequest request, CancellationToken ct);
    Task<OrderDto> MarkReadyAsync(Guid orderId, Guid adminUserId, OrderReadyRequest? request, CancellationToken ct);
    Task<OrderDto> CompleteAsync(Guid orderId, Guid adminUserId, OrderCompleteRequest? request, CancellationToken ct);
    
    // Order modification methods
    Task<OrderDto> ModifyAsync(Guid orderId, Guid adminUserId, OrderModifyRequest request, CancellationToken ct);
    Task<OrderDto> AcceptModificationsAsync(Guid orderId, Guid userId, OrderAcceptModificationsRequest? request, CancellationToken ct);
    Task<OrderDto> RejectModificationsAsync(Guid orderId, Guid userId, OrderRejectModificationsRequest request, CancellationToken ct);
}
