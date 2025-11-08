using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Moq;
using Sonirama.Api.Application.Auth;
using Sonirama.Api.Application.Auth.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;
using Xunit;

namespace Sonirama.Api.Tests.Auth;

public class AuthServiceTests
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
    public async Task LoginAsync_ShouldReturnTokens_WhenValid()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "u@ex.com", Role = Role.User, IsActive = true };
        user.PasswordHash = _hasher.HashPassword(user, "secret");
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _jwt.Setup(j => j.GenerateAccessToken(user)).Returns(("acc", DateTime.UtcNow.AddMinutes(60)));
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("ref1");
        _refresh.Setup(r => r.GetByTokenAsync("ref1", It.IsAny<CancellationToken>())).ReturnsAsync((RefreshToken?)null);
        _refresh.Setup(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var resp = await sut.LoginAsync(user.Email, "secret", CancellationToken.None);
        resp.AccessToken.Should().Be("acc");
        resp.RefreshToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task LoginAsync_ShouldFail_WhenInvalidPassword()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "u@ex.com", Role = Role.User, IsActive = true };
        user.PasswordHash = _hasher.HashPassword(user, "secret");
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var sut = CreateSut();
        await Assert.ThrowsAsync<UnauthorizedDomainException>(() => sut.LoginAsync(user.Email, "wrong", CancellationToken.None));
    }

    [Fact]
    public async Task RefreshAsync_ShouldFail_WhenTokenNotFound()
    {
        _refresh.Setup(r => r.GetByTokenAsync("nope", It.IsAny<CancellationToken>())).ReturnsAsync((RefreshToken?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<UnauthorizedDomainException>(() => sut.RefreshAsync("nope", CancellationToken.None));
    }
}
