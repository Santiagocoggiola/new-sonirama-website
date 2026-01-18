using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Orders;
using Sonirama.Api.Application.Orders.Dtos;
using Sonirama.Api.Infrastructure.Extensions;

namespace Sonirama.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize(Roles = "ADMIN,USER")]
public sealed class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderSummaryDto>>> ListAsync([FromQuery] OrderListRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var isAdmin = User.IsInRole("ADMIN");
        var result = await orderService.ListAsync(request, userId.Value, isAdmin, ct);
        return Ok(result);
    }

    [HttpGet("my")]
    public async Task<ActionResult<PagedResult<OrderSummaryDto>>> ListMineAsync([FromQuery] OrderListRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        // Force the current user and non-admin path so regular buyers can ver sus órdenes
        request.UserId = userId.Value;
        var result = await orderService.ListAsync(request, userId.Value, requesterIsAdmin: false, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var isAdmin = User.IsInRole("ADMIN");
        var dto = await orderService.GetByIdAsync(id, userId.Value, isAdmin, ct);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/confirm")]
    public async Task<ActionResult<OrderDto>> ConfirmAsync(Guid id, [FromBody] OrderConfirmRequest? request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var dto = await orderService.ConfirmAsync(id, userId.Value, request ?? new OrderConfirmRequest(), ct);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<OrderDto>> CancelAsync(Guid id, [FromBody] OrderCancelRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var dto = await orderService.CancelAsync(id, userId.Value, request, ct);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/cancel-admin")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<OrderDto>> CancelByAdminAsync(Guid id, [FromBody] OrderCancelRequest request, CancellationToken ct)
    {
        var adminId = User.GetUserId();
        if (adminId is null) return Unauthorized();
        var dto = await orderService.CancelByAdminAsync(id, adminId.Value, request, ct);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<OrderDto>> ApproveAsync(Guid id, [FromBody] OrderApproveRequest? request, CancellationToken ct)
    {
        var adminId = User.GetUserId();
        if (adminId is null) return Unauthorized();
        var dto = await orderService.ApproveAsync(id, adminId.Value, request ?? new OrderApproveRequest(), ct);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<OrderDto>> RejectAsync(Guid id, [FromBody] OrderRejectRequest request, CancellationToken ct)
    {
        var adminId = User.GetUserId();
        if (adminId is null) return Unauthorized();
        var dto = await orderService.RejectAsync(id, adminId.Value, request, ct);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/ready")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<OrderDto>> MarkReadyAsync(Guid id, [FromBody] OrderReadyRequest? request, CancellationToken ct)
    {
        var adminId = User.GetUserId();
        if (adminId is null) return Unauthorized();
        var dto = await orderService.MarkReadyAsync(id, adminId.Value, request ?? new OrderReadyRequest(), ct);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/complete")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<OrderDto>> CompleteAsync(Guid id, [FromBody] OrderCompleteRequest? request, CancellationToken ct)
    {
        var adminId = User.GetUserId();
        if (adminId is null) return Unauthorized();
        var dto = await orderService.CompleteAsync(id, adminId.Value, request ?? new OrderCompleteRequest(), ct);
        return Ok(dto);
    }

    /// <summary>
    /// Admin modifies a pending order (changes quantities). User must accept/reject the modifications.
    /// </summary>
    [HttpPost("{id:guid}/modify")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<OrderDto>> ModifyAsync(Guid id, [FromBody] OrderModifyRequest request, CancellationToken ct)
    {
        var adminId = User.GetUserId();
        if (adminId is null) return Unauthorized();
        var dto = await orderService.ModifyAsync(id, adminId.Value, request, ct);
        return Ok(dto);
    }

    /// <summary>
    /// User accepts the admin's modifications to their order.
    /// </summary>
    [HttpPost("{id:guid}/accept-modifications")]
    public async Task<ActionResult<OrderDto>> AcceptModificationsAsync(Guid id, [FromBody] OrderAcceptModificationsRequest? request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var dto = await orderService.AcceptModificationsAsync(id, userId.Value, request ?? new OrderAcceptModificationsRequest(), ct);
        return Ok(dto);
    }

    /// <summary>
    /// User rejects the admin's modifications and cancels the order.
    /// </summary>
    [HttpPost("{id:guid}/reject-modifications")]
    public async Task<ActionResult<OrderDto>> RejectModificationsAsync(Guid id, [FromBody] OrderRejectModificationsRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var dto = await orderService.RejectModificationsAsync(id, userId.Value, request, ct);
        return Ok(dto);
    }
}
