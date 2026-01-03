using Microsoft.AspNetCore.SignalR;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Notifications;
using Sonirama.Api.Application.Orders.Dtos;
using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Infrastructure.Notifications;

public sealed class OrderNotificationService(
    IHubContext<OrdersHub> hubContext,
    INotificationService notificationService) : IOrderNotificationService
{
    private readonly IHubContext<OrdersHub> _hubContext = hubContext;
    private readonly INotificationService _notifications = notificationService;

    public async Task NotifyCreatedAsync(OrderDto order, CancellationToken ct)
    {
        await BroadcastAsync("OrderCreated", order, ct);
        await CreateNotificationsAsync(order, isNew: true, ct);
    }

    public async Task NotifyUpdatedAsync(OrderDto order, CancellationToken ct)
    {
        await BroadcastAsync("OrderUpdated", order, ct);
        await CreateNotificationsAsync(order, isNew: false, ct);
    }

    private Task BroadcastAsync(string method, OrderDto order, CancellationToken ct)
    {
        var tasks = new List<Task>
        {
            _hubContext.Clients.Group(OrdersHub.AdminGroup).SendAsync(method, order, ct),
            _hubContext.Clients.Group(OrdersHub.BuildUserGroup(order.UserId)).SendAsync(method, order, ct)
        };
        return Task.WhenAll(tasks);
    }

    private async Task CreateNotificationsAsync(OrderDto order, bool isNew, CancellationToken ct)
    {
        var (type, title, body) = BuildNotification(order, isNew);

        // Persist + emit for the buyer
        await _notifications.CreateAsync(order.UserId, type, title, body, order.Id, ct);

        // Also notify admins so their campana/unread stay in sync
        await _notifications.CreateForAdminsAsync(type, title, body, order.Id, ct);
    }

    private static (NotificationType type, string title, string? body) BuildNotification(OrderDto order, bool isNew)
    {
        var total = order.Total.ToString("F2");

        if (isNew)
        {
            return (NotificationType.OrderCreated, $"Pedido {order.Number} recibido", $"Total: {order.Currency} {total}");
        }

        return order.Status switch
        {
            OrderStatus.Approved => (NotificationType.OrderApproved, $"Pedido {order.Number} aprobado", ""),
            OrderStatus.Rejected => (NotificationType.OrderRejected, $"Pedido {order.Number} rechazado", order.RejectionReason),
            OrderStatus.ReadyForPickup => (NotificationType.OrderReady, $"Pedido {order.Number} listo para retiro", order.AdminNotes),
            OrderStatus.Completed => (NotificationType.OrderCompleted, $"Pedido {order.Number} completado", null),
            OrderStatus.Cancelled => (NotificationType.OrderCancelled, $"Pedido {order.Number} cancelado", order.CancellationReason),
            OrderStatus.ModificationPending => (NotificationType.OrderStatusChanged, $"Pedido {order.Number} tiene modificaciones", order.ModificationReason),
            _ => (NotificationType.OrderStatusChanged, $"Pedido {order.Number} actualizado", null)
        };
    }
}
