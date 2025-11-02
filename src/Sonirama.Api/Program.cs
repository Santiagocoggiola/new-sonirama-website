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

var builder = WebApplication.CreateBuilder(args);

// Configuración
var configuration = builder.Configuration;

// Add services
builder.Services.AddOpenApi();
builder.Services.AddControllers();

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

// Servicios
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<DataSeeder>();

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

app.MapControllers();

app.Run();
