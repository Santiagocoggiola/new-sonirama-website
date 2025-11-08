using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(User user, CancellationToken ct);
    Task UpdateAsync(User user, CancellationToken ct);
    Task<bool> ExistsAsync(string email, CancellationToken ct);
    Task<PagedResult<User>> ListAsync(UserListFilter filter, CancellationToken ct);
    Task DeleteAsync(User user, CancellationToken ct); // soft delete via IsActive=false
}

