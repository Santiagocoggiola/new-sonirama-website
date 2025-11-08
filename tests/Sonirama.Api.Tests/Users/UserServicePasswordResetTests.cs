using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using Microsoft.AspNetCore.Identity;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Users;
using Sonirama.Api.Application.Users.Dtos;
using Sonirama.Api.Application.Users.Mapping;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;
using Xunit;

namespace Sonirama.Api.Tests.Users;

public class UserServicePasswordResetTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IPasswordResetRequestRepository> _resets = new();
    private readonly Mock<IPasswordHasher<User>> _hasher = new();
    private readonly Mock<IPasswordGenerator> _passwordGen = new();
    private readonly Mock<IEmailSender> _email = new();
    private readonly IMapper _mapper;

    public UserServicePasswordResetTests()
    {
        var cfg = new MapperConfiguration(c => c.AddProfile(new UserProfile()));
        _mapper = cfg.CreateMapper();
        _hasher.Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>())).Returns("HASH");
        _passwordGen.Setup(p => p.GenerateNumericCode(It.IsAny<int>())).Returns("123456");
        _passwordGen.Setup(p => p.Generate(It.IsAny<int>(), true)).Returns("NewPass1!");
    }

    private UserService CreateSut() => new(
        _users.Object,
        _resets.Object,
        _hasher.Object,
        _passwordGen.Object,
        _email.Object,
        _mapper);

    [Fact]
    public async Task StartPasswordResetAsync_ShouldThrow_WhenUserNotFound()
    {
        _users.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync((User?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.StartPasswordResetAsync("missing@ex.com", CancellationToken.None));
    }

    [Fact]
    public async Task StartPasswordResetAsync_ShouldCreateRequest_AndSendEmail()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "user@ex.com", FirstName = "U", LastName = "L", Role = Role.User, IsActive = true, PasswordHash = "H" };
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _resets.Setup(r => r.AddAsync(It.IsAny<PasswordResetRequest>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _email.Setup(e => e.SendAsync(user.Email, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var ok = await sut.StartPasswordResetAsync(user.Email, CancellationToken.None);
        ok.Should().BeTrue();
        _resets.Verify(r => r.AddAsync(It.IsAny<PasswordResetRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        _email.Verify(e => e.SendAsync(user.Email, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ConfirmPasswordResetAsync_ShouldThrow_WhenInvalidCode()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "user@ex.com", FirstName = "U", LastName = "L", Role = Role.User, IsActive = true, PasswordHash = "H" };
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _resets.Setup(r => r.GetActiveByUserAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new PasswordResetRequest
        {
            Id = Guid.NewGuid(), UserId = user.Id, Code = "654321", ExpiresAtUtc = DateTime.UtcNow.AddMinutes(5), CreatedAtUtc = DateTime.UtcNow
        });
        var sut = CreateSut();
        await Assert.ThrowsAsync<ValidationException>(() => sut.ConfirmPasswordResetAsync(user.Email, "123456", CancellationToken.None));
    }

    [Fact]
    public async Task ConfirmPasswordResetAsync_ShouldSucceed_WhenValidCode()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "user@ex.com", FirstName = "U", LastName = "L", Role = Role.User, IsActive = true, PasswordHash = "OLD" };
        _users.Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _hasher.Setup(h => h.HashPassword(user, It.IsAny<string>())).Returns("NEW_HASH");
        var req = new PasswordResetRequest { Id = Guid.NewGuid(), UserId = user.Id, Code = "123456", ExpiresAtUtc = DateTime.UtcNow.AddMinutes(5), CreatedAtUtc = DateTime.UtcNow };
        _resets.Setup(r => r.GetActiveByUserAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(req);
        _resets.Setup(r => r.MarkUsedAsync(req, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _users.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _email.Setup(e => e.SendAsync(user.Email, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var ok = await sut.ConfirmPasswordResetAsync(user.Email, "123456", CancellationToken.None);
        ok.Should().BeTrue();
        user.PasswordHash.Should().Be("NEW_HASH");
        _resets.Verify(r => r.MarkUsedAsync(req, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ForcePasswordResetAsync_ShouldChangePassword()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "user@ex.com", FirstName = "U", LastName = "L", Role = Role.User, IsActive = true, PasswordHash = "OLD" };
        _users.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _hasher.Setup(h => h.HashPassword(user, It.IsAny<string>())).Returns("FORCE_HASH");
        _users.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _email.Setup(e => e.SendAsync(user.Email, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var ok = await sut.ForcePasswordResetAsync(user.Id, CancellationToken.None);
        ok.Should().BeTrue();
        user.PasswordHash.Should().Be("FORCE_HASH");
    }
}
