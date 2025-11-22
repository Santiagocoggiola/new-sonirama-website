using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

public interface IOrderRepository
{
    Task AddAsync(Order order, CancellationToken ct);
    Task UpdateAsync(Order order, CancellationToken ct);
    Task<Order?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Order?> GetDetailedByIdAsync(Guid id, CancellationToken ct);
    Task<PagedResult<Order>> ListAsync(OrderListFilter filter, CancellationToken ct);
}
