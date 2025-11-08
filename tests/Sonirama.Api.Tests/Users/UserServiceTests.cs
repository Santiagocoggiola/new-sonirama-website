using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Application.Users;
using Sonirama.Api.Application.Users.Dtos;
using Sonirama.Api.Application.Users.Mapping;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;
using Xunit;

namespace Sonirama.Api.Tests.Users;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IPasswordResetRequestRepository> _resets = new();
    private readonly Mock<IPasswordHasher<User>> _hasher = new();
    private readonly Mock<IPasswordGenerator> _passwordGen = new();
    private readonly Mock<IEmailSender> _email = new();
    private readonly IMapper _mapper;

    public UserServiceTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile(new UserProfile()));
        _mapper = config.CreateMapper();
        _hasher.Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>())).Returns("HASH");
        _passwordGen.Setup(p => p.Generate(It.IsAny<int>(), true)).Returns("TempPass1!");
        _passwordGen.Setup(p => p.GenerateNumericCode(It.IsAny<int>())).Returns("123456");
    }

    private UserService CreateSut() => new(
        _users.Object,
        _resets.Object,
        _hasher.Object,
        _passwordGen.Object,
        _email.Object,
        _mapper);

    [Fact]
    public async Task CreateAsync_ShouldCreate_WhenValid()
    {
        _users.Setup(r => r.ExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _users.Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var dto = await sut.CreateAsync(new UserCreateRequest
        {
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            Role = Role.User
        }, CancellationToken.None);

        dto.Email.Should().Be("test@example.com");
        _users.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ShouldFail_WhenDuplicateEmail()
    {
        _users.Setup(r => r.ExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var sut = CreateSut();
        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(new UserCreateRequest
        {
            Email = "dup@example.com",
            FirstName = "Jane",
            LastName = "Doe",
            Role = Role.User
        }, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ShouldThrow_WhenNotFound()
    {
        _users.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.UpdateAsync(Guid.NewGuid(), new UserUpdateRequest
        {
            FirstName = "New",
            LastName = "Name",
            Role = Role.User,
            IsActive = true
        }, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteAsync_ShouldThrow_WhenNotFound()
    {
        _users.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.DeleteAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task ListAsync_ShouldReturnPaged()
    {
        var paged = new PagedResult<User>
        {
            Page = 1,
            PageSize = 10,
            TotalCount = 1,
            Items = new List<User> { new() { Id = Guid.NewGuid(), Email = "a@b.com", FirstName = "A", LastName = "B", Role = Role.User, PasswordHash = "H" } }
        };
        _users.Setup(r => r.ListAsync(It.IsAny<UserListFilter>(), It.IsAny<CancellationToken>())).ReturnsAsync(paged);
        var sut = CreateSut();
        var result = await sut.ListAsync(new UserFilterRequest { Page = 1, PageSize = 10 }, CancellationToken.None);
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdate_WhenExists()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "a@b.com", FirstName = "A", LastName = "B", Role = Role.User, PasswordHash = "H", IsActive = true };
        _users.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _users.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
    var dto = await sut.UpdateAsync(user.Id, new UserUpdateRequest { FirstName = "AA", LastName = "BB", Role = Role.Admin, IsActive = true }, CancellationToken.None);
    dto.Should().NotBeNull();
    dto!.FirstName.Should().Be("AA");
    dto.Role.Should().Be(Role.Admin);
        _users.Verify(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ShouldSoftDelete_WhenExists()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "a@b.com", FirstName = "A", LastName = "B", Role = Role.User, PasswordHash = "H", IsActive = true };
        _users.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _users.Setup(r => r.DeleteAsync(user, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var ok = await sut.DeleteAsync(user.Id, CancellationToken.None);
        ok.Should().BeTrue();
        _users.Verify(r => r.DeleteAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListAsync_ShouldPassFilters_ToRepository()
    {
        var paged = new PagedResult<User> { Page = 1, PageSize = 10, TotalCount = 0, Items = new List<User>() };
        _users.Setup(r => r.ListAsync(It.Is<UserListFilter>(f => f.Role == Role.Admin && f.IsActive == true && f.Query == "jo"), It.IsAny<CancellationToken>()))
              .ReturnsAsync(paged);

        var sut = CreateSut();
        var result = await sut.ListAsync(new UserFilterRequest { Page = 1, PageSize = 10, Role = Role.Admin, IsActive = true, Query = "jo" }, CancellationToken.None);
        result.TotalCount.Should().Be(0);
    }
}
