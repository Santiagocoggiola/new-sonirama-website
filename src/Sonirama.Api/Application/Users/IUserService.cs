using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Application.Users.Dtos;

namespace Sonirama.Api.Application.Users;

// Service abstraction encapsulating user business logic.
public interface IUserService
{
    Task<UserDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<PagedResult<UserDto>> ListAsync(UserFilterRequest filter, CancellationToken ct);
    Task<UserDto> CreateAsync(UserCreateRequest request, CancellationToken ct);
    Task<UserDto?> UpdateAsync(Guid id, UserUpdateRequest request, CancellationToken ct);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
    Task<bool> StartPasswordResetAsync(string email, CancellationToken ct); // anonymous path
    Task<bool> ConfirmPasswordResetAsync(string email, string code, CancellationToken ct); // anonymous path
    Task<bool> ForcePasswordResetAsync(Guid id, CancellationToken ct); // admin path
}
