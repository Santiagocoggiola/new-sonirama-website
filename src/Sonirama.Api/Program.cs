using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Sonirama.Api.Application.Auth;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Infrastructure;
using Sonirama.Api.Infrastructure.Auth;
using Sonirama.Api.Infrastructure.Init;
using Sonirama.Api.Infrastructure.Repositories;
using Sonirama.Api.Infrastructure.Email;
using Sonirama.Api.Infrastructure.Security;
using Sonirama.Api.Application.Users;
using Sonirama.Api.Application.Products;
using Sonirama.Api.Application.Products.Discounts;
using AutoMapper;
using Sonirama.Api.Infrastructure.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configuración
var configuration = builder.Configuration;

// Add services
builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddAutoMapper(
    typeof(Sonirama.Api.Application.Users.Mapping.UserProfile),
    typeof(Sonirama.Api.Application.Products.Mapping.ProductProfile),
    typeof(Sonirama.Api.Application.Products.Discounts.Mapping.BulkDiscountProfile)
);

// EF Core PostgreSQL (Npgsql)
var connectionString = configuration.GetConnectionString("Default");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// Options
builder.Services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
builder.Services.Configure<AdminSeedOptions>(configuration.GetSection("AdminSeed"));

// Identity util: Password hasher
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Repositorios
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IPasswordResetRequestRepository, PasswordResetRequestRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IBulkDiscountRepository, BulkDiscountRepository>();

// Servicios
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<DataSeeder>();
builder.Services.AddScoped<IEmailSender, ConsoleEmailSender>();
builder.Services.AddScoped<IPasswordGenerator, PasswordGenerator>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IBulkDiscountService, BulkDiscountService>();

// Autenticación JWT
var jwtSection = configuration.GetSection("Jwt");
var issuer = jwtSection["Issuer"]!;
var audience = jwtSection["Audience"]!;
var key = jwtSection["Key"]!;
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30),
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = signingKey
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Migraciones + Seed DB/Admin (tolerante a errores si DB no disponible)
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
    await seeder.InitializeAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"[WARN] No se pudo inicializar datos: {ex.Message}");
}

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// Global exception handling (custom domain exceptions -> JSON)
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapControllers();

await app.RunAsync();
