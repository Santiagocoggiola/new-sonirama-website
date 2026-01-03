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
                                 IOrderNotificationService notificationService,
                                 IProductRepository productRepository) : IOrderService
{
    private const string OrderNotFoundMessage = "Pedido no encontrado";
    private readonly ICartRepository _cartRepository = cartRepository;
    private readonly IOrderRepository _orderRepository = orderRepository;
    private readonly IOrderNotificationService _notifications = notificationService;
    private readonly IProductRepository _productRepository = productRepository;

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

        var dto = await MapOrderAsync(order, ct);
        await _notifications.NotifyCreatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> GetByIdAsync(Guid orderId, Guid requesterId, bool requesterIsAdmin, CancellationToken ct)
    {
    var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAccess(order, requesterId, requesterIsAdmin);
        return await MapOrderAsync(order, ct);
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
        var dto = await MapOrderAsync(order, ct);
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
        // Puede cancelar mientras no haya salido a preparación/entrega
        if (order.Status is not OrderStatus.PendingApproval
            and not OrderStatus.Approved
            and not OrderStatus.ModificationPending
            and not OrderStatus.Confirmed)
        {
            throw new ValidationException("Solo podés cancelar pedidos que aún no están listos para retiro/entrega.");
        }

        order.Status = OrderStatus.Cancelled;
        order.CancelledAtUtc = DateTime.UtcNow;
    order.CancellationReason = request.Reason.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = await MapOrderAsync(order, ct);
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
        var dto = await MapOrderAsync(order, ct);
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
        var dto = await MapOrderAsync(order, ct);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> MarkReadyAsync(Guid orderId, Guid adminUserId, OrderReadyRequest? request, CancellationToken ct)
    {
        request ??= new OrderReadyRequest();
    var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAdmin(adminUserId);
        if (order.Status is not OrderStatus.Approved and not OrderStatus.Confirmed)
        {
            throw new ValidationException("Solo se pueden marcar como listos los pedidos aprobados o confirmados.");
        }

        order.Status = OrderStatus.ReadyForPickup;
        order.ReadyAtUtc = DateTime.UtcNow;
        order.ReadyByUserId = adminUserId;
    order.AdminNotes = string.IsNullOrWhiteSpace(request.ReadyNotes) ? order.AdminNotes : request.ReadyNotes.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = await MapOrderAsync(order, ct);
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
        var dto = await MapOrderAsync(order, ct);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> ModifyAsync(Guid orderId, Guid adminUserId, OrderModifyRequest request, CancellationToken ct)
    {
        if (request is null)
        {
            throw new ValidationException("La solicitud de modificación es obligatoria.");
        }
        if (request.Items is null || request.Items.Count == 0)
        {
            throw new ValidationException("Debés indicar al menos un item a modificar.");
        }
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ValidationException("Debés indicar el motivo de la modificación.");
        }

        var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAdmin(adminUserId);
        
        if (order.Status is not OrderStatus.PendingApproval)
        {
            throw new ValidationException("Solo se pueden modificar pedidos pendientes de aprobación.");
        }

        // Store original total before modifications
        order.OriginalTotal = order.Total;

        // Apply modifications to items
        foreach (var modification in request.Items)
        {
            var item = order.Items.FirstOrDefault(i => i.ProductId == modification.ProductId);
            if (item is null)
            {
                throw new ValidationException($"El producto con ID {modification.ProductId} no existe en el pedido.");
            }

            if (modification.NewQuantity < 0)
            {
                throw new ValidationException("La cantidad no puede ser negativa.");
            }

            // Store original quantity if not already stored
            item.OriginalQuantity ??= item.Quantity;
            
            // Update quantity and recalculate line total
            item.Quantity = modification.NewQuantity;
            item.LineTotal = item.UnitPriceWithDiscount * modification.NewQuantity;
        }

        // Remove items with 0 quantity
        var itemsToRemove = order.Items.Where(i => i.Quantity == 0).ToList();
        foreach (var item in itemsToRemove)
        {
            order.Items.Remove(item);
        }

        if (order.Items.Count == 0)
        {
            throw new ValidationException("No se puede dejar el pedido sin items. Usá rechazar en su lugar.");
        }

        // Recalculate totals
        order.Subtotal = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        order.Total = order.Items.Sum(i => i.LineTotal);
        order.DiscountTotal = order.Subtotal - order.Total;

        // Set modification metadata
        order.Status = OrderStatus.ModificationPending;
        order.ModificationReason = request.Reason.Trim();
        order.ModifiedByUserId = adminUserId;
        order.ModifiedAtUtc = DateTime.UtcNow;
        order.AdminNotes = string.IsNullOrWhiteSpace(request.AdminNotes) ? order.AdminNotes : request.AdminNotes.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = await MapOrderAsync(order, ct);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> AcceptModificationsAsync(Guid orderId, Guid userId, OrderAcceptModificationsRequest? request, CancellationToken ct)
    {
        request ??= new OrderAcceptModificationsRequest();
        var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAccess(order, userId, false);
        EnsureStatus(order, OrderStatus.ModificationPending, "Este pedido no tiene modificaciones pendientes de aceptar.");

        // User accepts modifications, move to Approved status
        order.Status = OrderStatus.Approved;
        order.ApprovedAtUtc = DateTime.UtcNow;
        order.UserNotes = string.IsNullOrWhiteSpace(request.Note) ? order.UserNotes : request.Note.Trim();
        order.UpdatedAtUtc = DateTime.UtcNow;

        // Clear original quantities as modifications are accepted
        foreach (var item in order.Items)
        {
            item.OriginalQuantity = null;
        }
        order.OriginalTotal = null;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = await MapOrderAsync(order, ct);
        await _notifications.NotifyUpdatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> RejectModificationsAsync(Guid orderId, Guid userId, OrderRejectModificationsRequest request, CancellationToken ct)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ValidationException("Debés indicar el motivo del rechazo de las modificaciones.");
        }

        var order = await _orderRepository.GetDetailedByIdAsync(orderId, ct) ?? throw new NotFoundException(OrderNotFoundMessage);
        EnsureAccess(order, userId, false);
        EnsureStatus(order, OrderStatus.ModificationPending, "Este pedido no tiene modificaciones pendientes.");

        // User rejects modifications, cancel the order
        order.Status = OrderStatus.Cancelled;
        order.CancelledAtUtc = DateTime.UtcNow;
        order.CancellationReason = $"Usuario rechazó modificaciones: {request.Reason.Trim()}";
        order.UpdatedAtUtc = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order, ct);
        var dto = await MapOrderAsync(order, ct);
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

    private record ProductImageInfo(string Url, string? AltText);

    private async Task<OrderDto> MapOrderAsync(Order order, CancellationToken ct)
    {
        var imageMap = await LoadPrimaryImagesAsync(order.Items.Select(i => i.ProductId), ct);

        return new OrderDto
        {
            Id = order.Id,
            Number = order.Number,
            Status = order.Status,
            UserId = order.UserId,
            Subtotal = order.Subtotal,
            DiscountTotal = order.DiscountTotal,
            Total = order.Total,
            OriginalTotal = order.OriginalTotal,
            Currency = order.Currency,
            UserNotes = order.UserNotes,
            AdminNotes = order.AdminNotes,
            RejectionReason = order.RejectionReason,
            CancellationReason = order.CancellationReason,
            ModificationReason = order.ModificationReason,
            ModifiedAtUtc = order.ModifiedAtUtc,
            CreatedAtUtc = order.CreatedAtUtc,
            UpdatedAtUtc = order.UpdatedAtUtc,
            ApprovedAtUtc = order.ApprovedAtUtc,
            RejectedAtUtc = order.RejectedAtUtc,
            ConfirmedAtUtc = order.ConfirmedAtUtc,
            ReadyAtUtc = order.ReadyAtUtc,
            CompletedAtUtc = order.CompletedAtUtc,
            CancelledAtUtc = order.CancelledAtUtc,
            Items = order.Items.Select(i =>
            {
                imageMap.TryGetValue(i.ProductId, out var image);
                return new OrderItemDto
                {
                    ProductId = i.ProductId,
                    ProductCode = i.ProductCode,
                    ProductName = i.ProductName,
                    ProductImageUrl = image?.Url,
                    ProductImageAlt = image?.AltText,
                    Quantity = i.Quantity,
                    OriginalQuantity = i.OriginalQuantity,
                    UnitPrice = i.UnitPrice,
                    DiscountPercent = i.DiscountPercent,
                    UnitPriceWithDiscount = i.UnitPriceWithDiscount,
                    Subtotal = i.UnitPrice * i.Quantity,
                    LineTotal = i.LineTotal
                };
            }).ToList()
        };
    }

    private async Task<Dictionary<Guid, ProductImageInfo>> LoadPrimaryImagesAsync(IEnumerable<Guid> productIds, CancellationToken ct)
    {
        var result = new Dictionary<Guid, ProductImageInfo>();
        var uniqueIds = productIds.Distinct().ToList();

        foreach (var productId in uniqueIds)
        {
            var product = await _productRepository.GetByIdAsync(productId, ct);
            if (product is null || product.Images.Count == 0) continue;

            var primary = product.Images
                .OrderBy(i => i.UploadedAtUtc)
                .First();

            result[productId] = new ProductImageInfo(primary.Url, primary.FileName);
        }

        return result;
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
