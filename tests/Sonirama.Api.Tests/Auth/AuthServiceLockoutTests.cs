using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Moq;
using Sonirama.Api.Application.Auth;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;
using Xunit;

namespace Sonirama.Api.Tests.Auth;

public class AuthServiceLockoutTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IRefreshTokenRepository> _refresh = new();
    private readonly Mock<IJwtTokenService> _jwt = new();
    private readonly IPasswordHasher<User> _hasher = new PasswordHasher<User>();
    private readonly IOptions<JwtOptions> _options = Options.Create(new JwtOptions
    {
        Issuer = "iss",
        Audience = "aud",
        Key = new string('k', 64),
        AccessTokenMinutes = 60,
        RefreshTokenDays = 7
    });

    private AuthService CreateSut() => new(_users.Object, _refresh.Object, _jwt.Object, _options, _hasher);

    [Fact]
    public async Task LoginAsync_ShouldIncrementFailedAttempts_WhenWrongPassword()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Role = Role.User,
            IsActive = true,
            FailedLoginAttempts = 0
        };
        user.PasswordHash = _hasher.HashPassword(user, "correct");
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _users.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        
        var ex = await Assert.ThrowsAsync<UnauthorizedDomainException>(
            () => sut.LoginAsync(user.Email, "wrong", CancellationToken.None));

        ex.Message.Should().Contain("4 intento(s) restante(s)");
        user.FailedLoginAttempts.Should().Be(1);
        _users.Verify(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_ShouldLockout_AfterFiveFailedAttempts()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Role = Role.User,
            IsActive = true,
            FailedLoginAttempts = 4 // Already 4 failed attempts
        };
        user.PasswordHash = _hasher.HashPassword(user, "correct");
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _users.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();

        var ex = await Assert.ThrowsAsync<UnauthorizedDomainException>(
            () => sut.LoginAsync(user.Email, "wrong", CancellationToken.None));

        ex.Message.Should().Contain("bloqueada por 15 minutos");
        user.LockoutEndUtc.Should().NotBeNull();
        user.LockoutEndUtc.Should().BeAfter(DateTime.UtcNow);
        user.FailedLoginAttempts.Should().Be(0); // Reset after lockout
    }

    [Fact]
    public async Task LoginAsync_ShouldRejectLogin_WhenUserIsLockedOut()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Role = Role.User,
            IsActive = true,
            FailedLoginAttempts = 0,
            LockoutEndUtc = DateTime.UtcNow.AddMinutes(10) // Locked for 10 more minutes
        };
        user.PasswordHash = _hasher.HashPassword(user, "correct");
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var sut = CreateSut();

        var ex = await Assert.ThrowsAsync<UnauthorizedDomainException>(
            () => sut.LoginAsync(user.Email, "correct", CancellationToken.None));

        ex.Message.Should().Contain("Cuenta bloqueada temporalmente");
        _users.Verify(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_ShouldResetLockout_OnSuccessfulLogin()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Role = Role.User,
            IsActive = true,
            FailedLoginAttempts = 3,
            LockoutEndUtc = DateTime.UtcNow.AddMinutes(-5) // Lockout expired
        };
        user.PasswordHash = _hasher.HashPassword(user, "correct");
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _users.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _jwt.Setup(j => j.GenerateAccessToken(user)).Returns(("access-token", DateTime.UtcNow.AddHours(1)));
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("refresh-token");
        _refresh.Setup(r => r.GetByTokenAsync("refresh-token", It.IsAny<CancellationToken>())).ReturnsAsync((RefreshToken?)null);
        _refresh.Setup(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var result = await sut.LoginAsync(user.Email, "correct", CancellationToken.None);

        result.AccessToken.Should().Be("access-token");
        user.FailedLoginAttempts.Should().Be(0);
        user.LockoutEndUtc.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_ShouldAllowLogin_WhenLockoutExpired()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Role = Role.User,
            IsActive = true,
            FailedLoginAttempts = 0,
            LockoutEndUtc = DateTime.UtcNow.AddMinutes(-1) // Lockout expired 1 minute ago
        };
        user.PasswordHash = _hasher.HashPassword(user, "correct");
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _users.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _jwt.Setup(j => j.GenerateAccessToken(user)).Returns(("access-token", DateTime.UtcNow.AddHours(1)));
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("refresh-token");
        _refresh.Setup(r => r.GetByTokenAsync("refresh-token", It.IsAny<CancellationToken>())).ReturnsAsync((RefreshToken?)null);
        _refresh.Setup(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var result = await sut.LoginAsync(user.Email, "correct", CancellationToken.None);

        result.AccessToken.Should().NotBeEmpty();
    }
}
