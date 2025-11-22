using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Application.Orders.Dtos;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Application.Orders;

public sealed class OrderService(ICartRepository cartRepository,
                                 IOrderRepository orderRepository,
                                 IOrderNotificationService notificationService) : IOrderService
{
    private const string OrderNotFoundMessage = "Pedido no encontrado";
    private readonly ICartRepository _cartRepository = cartRepository;
    private readonly IOrderRepository _orderRepository = orderRepository;
    private readonly IOrderNotificationService _notifications = notificationService;

    public async Task<OrderDto> CreateFromCartAsync(Guid userId, CancellationToken ct)
    {
        var cart = await _cartRepository.GetDetailedByUserIdAsync(userId, ct) ?? throw new ValidationException("El carrito no está disponible");
        if (cart.Items.Count == 0)
        {
            throw new ValidationException("El carrito está vacío. Agregá productos antes de generar un pedido.");
        }

        var firstProduct = cart.Items.First().Product ?? throw new InvalidOperationException("El carrito contiene un producto inválido.");
        var currency = firstProduct.Currency;
        if (cart.Items.Any(i => i.Product is null || i.Product.Currency != currency))
        {
            throw new ValidationException("Todos los productos del carrito deben tener la misma moneda antes de generar el pedido.");
        }
        var order = new Order
        {
            Number = GenerateNumber(),
            UserId = userId,
            Status = OrderStatus.PendingApproval,
            Currency = currency,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        foreach (var item in cart.Items)
        {
            if (item.Product is null)
            {
                throw new InvalidOperationException("El carrito tiene un producto inválido.");
            }

            var mapped = MapCartItemToOrderItem(item);
            order.Items.Add(mapped);
        }

        order.Subtotal = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        order.Total = order.Items.Sum(i => i.LineTotal);
        order.DiscountTotal = order.Subtotal - order.Total;

        await _orderRepository.AddAsync(order, ct);
        await _cartRepository.ClearAsync(cart.Id, ct);

        var dto = MapOrder(order);
        await _notifications.NotifyCreatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> GetByIdAsync(Guid orderId, Guid requesterId, bool requesterIsAdmin, CancellationToken ct)
    {
    var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAccess(order, requesterId, requesterIsAdmin);
        return MapOrder(order);
    }

    public async Task<PagedResult<OrderSummaryDto>> ListAsync(OrderListRequest request, Guid requesterId, bool requesterIsAdmin, CancellationToken ct)
    {
        var filter = new OrderListFilter
        {
            Page = request.Page,
            PageSize = request.PageSize,
            Query = request.Query,
            Status = request.Status,
            CreatedFromUtc = request.CreatedFromUtc,
            CreatedToUtc = request.CreatedToUtc,
            SortBy = request.SortBy,
            SortDir = request.SortDir,
            UserId = requesterIsAdmin ? request.UserId : requesterId,
            IncludeAllUsers = requesterIsAdmin && request.UserId is null
        };

        var page = await _orderRepository.ListAsync(filter, ct);
        var items = page.Items.Select(MapSummary).ToList();
        return new PagedResult<OrderSummaryDto>
        {
            Page = page.Page,
            PageSize = page.PageSize,
            TotalCount = page.TotalCount,
            Items = items
        };
    }

    public async Task<OrderDto> ConfirmAsync(Guid orderId, Guid userId, OrderConfirmRequest? request, CancellationToken ct)
    {
        request ??= new OrderConfirmRequest();
    var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAccess(order, userId, false);
        EnsureStatus(order, OrderStatus.Approved, "Solo podés confirmar pedidos aprobados.");

        order.Status = OrderStatus.Confirmed;
        order.ConfirmedAtUtc = DateTime.UtcNow;
    order.UserNotes = string.IsNullOrWhiteSpace(request.Note) ? order.UserNotes : request.Note.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = MapOrder(order);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> CancelAsync(Guid orderId, Guid userId, OrderCancelRequest request, CancellationToken ct)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ValidationException("Debés indicar el motivo de cancelación.");
        }
    var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAccess(order, userId, false);
        if (order.Status is not OrderStatus.PendingApproval and not OrderStatus.Approved)
        {
            throw new ValidationException("Solo podés cancelar pedidos pendientes o aprobados.");
        }

        order.Status = OrderStatus.Cancelled;
        order.CancelledAtUtc = DateTime.UtcNow;
    order.CancellationReason = request.Reason.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = MapOrder(order);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> ApproveAsync(Guid orderId, Guid adminUserId, OrderApproveRequest? request, CancellationToken ct)
    {
        request ??= new OrderApproveRequest();
    var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAdmin(adminUserId);
        EnsureStatus(order, OrderStatus.PendingApproval, "Solo se pueden aprobar pedidos pendientes.");

        order.Status = OrderStatus.Approved;
        order.ApprovedAtUtc = DateTime.UtcNow;
        order.ApprovedByUserId = adminUserId;
    order.AdminNotes = string.IsNullOrWhiteSpace(request.AdminNotes) ? order.AdminNotes : request.AdminNotes.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = MapOrder(order);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> RejectAsync(Guid orderId, Guid adminUserId, OrderRejectRequest request, CancellationToken ct)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ValidationException("El motivo de rechazo es obligatorio.");
        }
    var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAdmin(adminUserId);
        EnsureStatus(order, OrderStatus.PendingApproval, "Solo se pueden rechazar pedidos pendientes.");

        order.Status = OrderStatus.Rejected;
        order.RejectedAtUtc = DateTime.UtcNow;
        order.RejectedByUserId = adminUserId;
    order.RejectionReason = request.Reason.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = MapOrder(order);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> MarkReadyAsync(Guid orderId, Guid adminUserId, OrderReadyRequest? request, CancellationToken ct)
    {
        request ??= new OrderReadyRequest();
    var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAdmin(adminUserId);
        EnsureStatus(order, OrderStatus.Confirmed, "El pedido debe estar confirmado por el usuario antes de marcarlo listo.");

        order.Status = OrderStatus.ReadyForPickup;
        order.ReadyAtUtc = DateTime.UtcNow;
        order.ReadyByUserId = adminUserId;
    order.AdminNotes = string.IsNullOrWhiteSpace(request.ReadyNotes) ? order.AdminNotes : request.ReadyNotes.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = MapOrder(order);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> CompleteAsync(Guid orderId, Guid adminUserId, OrderCompleteRequest? request, CancellationToken ct)
    {
        var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException("Pedido no encontrado");
    EnsureAdmin(adminUserId);
    request ??= new OrderCompleteRequest();
        EnsureStatus(order, OrderStatus.ReadyForPickup, "El pedido debe estar listo para retiro antes de completarlo.");

        order.Status = OrderStatus.Completed;
        order.CompletedAtUtc = DateTime.UtcNow;
        order.CompletedByUserId = adminUserId;
    order.AdminNotes = string.IsNullOrWhiteSpace(request.CompletionNotes) ? order.AdminNotes : request.CompletionNotes.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = MapOrder(order);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    private static OrderItem MapCartItemToOrderItem(Domain.Entities.CartItem item)
    {
        var product = item.Product ?? throw new InvalidOperationException("El item del carrito no tiene producto");
        var now = DateTime.UtcNow;
        var discounts = product.BulkDiscounts ?? Array.Empty<BulkDiscount>();
        var discount = discounts
            .Where(d => d.MinQuantity <= item.Quantity && d.IsCurrentlyValid(now))
            .OrderByDescending(d => d.DiscountPercent)
            .FirstOrDefault();

        var discountPercent = discount?.DiscountPercent ?? 0m;
        var unitPrice = product.Price;
        var unitPriceWithDiscount = unitPrice * (1 - (discountPercent / 100m));
        var lineTotal = unitPriceWithDiscount * item.Quantity;

        return new OrderItem
        {
            ProductId = item.ProductId,
            ProductCode = product.Code,
            ProductName = product.Name,
            Quantity = item.Quantity,
            UnitPrice = unitPrice,
            DiscountPercent = discountPercent,
            UnitPriceWithDiscount = unitPriceWithDiscount,
            LineTotal = lineTotal,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    private static string GenerateNumber()
    {
        return $"SO-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }

    private static void EnsureAccess(Order order, Guid requesterId, bool isAdmin)
    {
        if (isAdmin) return;
        if (order.UserId != requesterId)
        {
            throw new ForbiddenException("No podés acceder a pedidos de otros usuarios.");
        }
    }

    private static void EnsureStatus(Order order, OrderStatus expected, string message)
    {
        if (order.Status != expected)
        {
            throw new ValidationException(message);
        }
    }

    private static void EnsureAdmin(Guid adminUserId)
    {
        if (adminUserId == Guid.Empty)
        {
            throw new ForbiddenException("Acción reservada para administradores.");
        }
    }

    private static OrderDto MapOrder(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            Number = order.Number,
            Status = order.Status,
            UserId = order.UserId,
            Subtotal = order.Subtotal,
            DiscountTotal = order.DiscountTotal,
            Total = order.Total,
            Currency = order.Currency,
            UserNotes = order.UserNotes,
            AdminNotes = order.AdminNotes,
            RejectionReason = order.RejectionReason,
            CancellationReason = order.CancellationReason,
            CreatedAtUtc = order.CreatedAtUtc,
            UpdatedAtUtc = order.UpdatedAtUtc,
            ApprovedAtUtc = order.ApprovedAtUtc,
            RejectedAtUtc = order.RejectedAtUtc,
            ConfirmedAtUtc = order.ConfirmedAtUtc,
            ReadyAtUtc = order.ReadyAtUtc,
            CompletedAtUtc = order.CompletedAtUtc,
            CancelledAtUtc = order.CancelledAtUtc,
            Items = order.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                ProductCode = i.ProductCode,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                DiscountPercent = i.DiscountPercent,
                UnitPriceWithDiscount = i.UnitPriceWithDiscount,
                LineTotal = i.LineTotal
            }).ToList()
        };
    }

    private static OrderSummaryDto MapSummary(Order order)
        => new()
        {
            Id = order.Id,
            Number = order.Number,
            Status = order.Status,
            UserId = order.UserId,
            Total = order.Total,
            Currency = order.Currency,
            CreatedAtUtc = order.CreatedAtUtc,
            UpdatedAtUtc = order.UpdatedAtUtc,
            ItemCount = order.Items.Count
        };
}
