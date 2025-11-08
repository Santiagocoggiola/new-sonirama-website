using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Application.Users.Dtos;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Application.Users;

// Concrete user service implementing CRUD, listing, and password reset flows.
public sealed class UserService(
    IUserRepository users,
    IPasswordResetRequestRepository resets,
    IPasswordHasher<User> hasher,
    IPasswordGenerator passwordGenerator,
    IEmailSender emailSender,
    IMapper mapper) : IUserService
{
    private const string UserNotFoundMsg = "Usuario no encontrado";

    public async Task<UserDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var entity = await users.GetByIdAsync(id, ct);
        return entity is null ? null : mapper.Map<UserDto>(entity);
    }

    public async Task<PagedResult<UserDto>> ListAsync(UserFilterRequest filter, CancellationToken ct)
    {
        var repoFilter = new UserListFilter
        {
            Page = filter.Page,
            PageSize = filter.PageSize,
            Query = filter.Query,
            Role = filter.Role,
            IsActive = filter.IsActive,
            SortBy = filter.SortBy,
            SortDir = filter.SortDir
        };

        var result = await users.ListAsync(repoFilter, ct);
        return new PagedResult<UserDto>
        {
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount,
            Items = result.Items.Select(mapper.Map<UserDto>).ToList()
        };
    }

    public async Task<UserDto> CreateAsync(UserCreateRequest request, CancellationToken ct)
    {
        if (!Role.IsValid(request.Role)) throw new ValidationException("Rol inválido");
        if (await users.ExistsAsync(request.Email, ct)) throw new ConflictException("El email ya está en uso");

        var entity = mapper.Map<User>(request);
        entity.Email = request.Email.Trim().ToLowerInvariant();
        entity.CreatedAtUtc = DateTime.UtcNow;
        entity.IsActive = true;

        // Generate a new password of 10 chars with symbols.
        var plainPassword = passwordGenerator.Generate(10, includeSymbols: true);
        entity.PasswordHash = hasher.HashPassword(entity, plainPassword);

        await users.AddAsync(entity, ct);

        // Send email with credentials
    await emailSender.SendAsync(entity.Email, "Tu cuenta ha sido creada", $"Hola {entity.FirstName}! Tu contraseña temporal es: {plainPassword}", ct);

        return mapper.Map<UserDto>(entity);
    }

    public async Task<UserDto?> UpdateAsync(Guid id, UserUpdateRequest request, CancellationToken ct)
    {
        var entity = await users.GetByIdAsync(id, ct);
    if (entity is null) throw new NotFoundException(UserNotFoundMsg);
        if (!entity.IsActive && request.IsActive) // re-activate allowed
        {
            entity.IsActive = true;
        }

        mapper.Map(request, entity);
        entity.UpdatedAtUtc = DateTime.UtcNow;
        await users.UpdateAsync(entity, ct);
        return mapper.Map<UserDto>(entity);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var entity = await users.GetByIdAsync(id, ct);
    if (entity is null) throw new NotFoundException(UserNotFoundMsg);
        await users.DeleteAsync(entity, ct);
        return true;
    }

    public async Task<bool> StartPasswordResetAsync(string email, CancellationToken ct)
    {
        var user = await users.GetByEmailAsync(email.Trim().ToLowerInvariant(), ct);
    if (user is null || !user.IsActive) throw new NotFoundException(UserNotFoundMsg);

        // Invalidate existing active request implicitly by creating a new one (we keep only last one logically)
        var code = passwordGenerator.GenerateNumericCode(6);
        var req = new PasswordResetRequest
        {
            UserId = user.Id,
            Code = code,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
            CreatedAtUtc = DateTime.UtcNow,
            Used = false
        };
        await resets.AddAsync(req, ct);

        await emailSender.SendAsync(user.Email, "Código de recuperación", $"Tu código es: {code}", ct);
        return true;
    }

    public async Task<bool> ConfirmPasswordResetAsync(string email, string code, CancellationToken ct)
    {
        var user = await users.GetByEmailAsync(email.Trim().ToLowerInvariant(), ct);
    if (user is null || !user.IsActive) throw new NotFoundException(UserNotFoundMsg);

        var active = await resets.GetActiveByUserAsync(user.Id, ct);
        if (active is null) throw new ValidationException("Código inválido o expirado");
        if (!string.Equals(active.Code, code, StringComparison.Ordinal)) throw new ValidationException("Código inválido");

        // Generate new password
        var newPassword = passwordGenerator.Generate(10, includeSymbols: true);
        user.PasswordHash = hasher.HashPassword(user, newPassword);
        user.UpdatedAtUtc = DateTime.UtcNow;
        await users.UpdateAsync(user, ct);

        await resets.MarkUsedAsync(active, ct);

        await emailSender.SendAsync(user.Email, "Tu nueva contraseña", $"Tu nueva contraseña es: {newPassword}", ct);
        return true;
    }

    public async Task<bool> ForcePasswordResetAsync(Guid id, CancellationToken ct)
    {
        var user = await users.GetByIdAsync(id, ct);
    if (user is null) throw new NotFoundException(UserNotFoundMsg);
        var newPassword = passwordGenerator.Generate(10, includeSymbols: true);
        user.PasswordHash = hasher.HashPassword(user, newPassword);
        user.UpdatedAtUtc = DateTime.UtcNow;
        await users.UpdateAsync(user, ct);
        await emailSender.SendAsync(user.Email, "Reinicio de contraseña por administrador", $"Tu nueva contraseña es: {newPassword}", ct);
        return true;
    }
}
