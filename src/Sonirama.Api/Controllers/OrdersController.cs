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
}
