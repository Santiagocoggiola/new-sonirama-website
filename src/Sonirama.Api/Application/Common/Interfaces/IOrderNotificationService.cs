using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Common.Interfaces;

public interface IOrderNotificationService
{
    Task NotifyCreatedAsync(OrderDto order, CancellationToken ct);
    Task NotifyUpdatedAsync(OrderDto order, CancellationToken ct);
}
