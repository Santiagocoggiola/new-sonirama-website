using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sonirama.Api.Application.Auth;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Users;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Infrastructure.Auth;
using Sonirama.Api.Infrastructure.Email;
using Sonirama.Api.Infrastructure.Repositories;
using Sonirama.Api.Infrastructure.Security;

namespace Sonirama.Api.Infrastructure.Extensions;

// DI aggregator extension to register application/infrastructure services.
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSoniramaServices(this IServiceCollection services, IConfiguration configuration)
    {
        // AutoMapper
        services.AddAutoMapper(typeof(Sonirama.Api.Application.Users.Mapping.UserProfile));

        // Identity utils
        services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IPasswordResetRequestRepository, PasswordResetRequestRepository>();

        // Services
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();

        // Utilities
        services.AddScoped<IEmailSender, ConsoleEmailSender>();
        services.AddScoped<IPasswordGenerator, PasswordGenerator>();

        return services;
    }
}
