using Microsoft.AspNetCore.SignalR;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Infrastructure.Notifications;

public sealed class OrderNotificationService(IHubContext<OrdersHub> hubContext) : IOrderNotificationService
{
    private readonly IHubContext<OrdersHub> _hubContext = hubContext;

    public Task NotifyCreatedAsync(OrderDto order, CancellationToken ct)
        => BroadcastAsync("OrderCreated", order, ct);

    public Task NotifyUpdatedAsync(OrderDto order, CancellationToken ct)
        => BroadcastAsync("OrderUpdated", order, ct);

    private Task BroadcastAsync(string method, OrderDto order, CancellationToken ct)
    {
        var tasks = new List<Task>
        {
            _hubContext.Clients.Group(OrdersHub.AdminGroup).SendAsync(method, order, ct),
            _hubContext.Clients.Group(OrdersHub.BuildUserGroup(order.UserId)).SendAsync(method, order, ct)
        };
        return Task.WhenAll(tasks);
    }
}
