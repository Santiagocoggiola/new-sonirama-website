using System.Text;
using System.Threading.RateLimiting;
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
using Sonirama.Api.Application.Categories;
using Sonirama.Api.Application.Carts;
using AutoMapper;
using Sonirama.Api.Infrastructure.Middleware;
using Sonirama.Api.Application.Orders;
using Sonirama.Api.Application.Notifications;
using Sonirama.Api.Infrastructure.Notifications;
using Sonirama.Api.Infrastructure.Images;
using Sonirama.Api.Infrastructure.Extensions;
using Serilog;
using FluentValidation;

// Cargar variables de entorno desde .env (si existe)
EnvironmentExtensions.LoadDotEnv(Directory.GetCurrentDirectory());

var builder = WebApplication.CreateBuilder(args);

// Serilog - Structured logging
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

// Configuración - Las variables de entorno tienen prioridad sobre appsettings
var configuration = builder.Configuration;

// Add services
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, ct) =>
    {
        document.Info.Title = "Sonirama API";
        document.Info.Version = "v1";
        document.Info.Description = "API para el marketplace Sonirama - Gestión de productos, pedidos, usuarios y notificaciones.";
        document.Info.Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Sonirama Support",
            Email = "soporte@sonirama.com"
        };
        return Task.CompletedTask;
    });
});
builder.Services.AddControllers();
builder.Services.AddSignalR();

// FluentValidation - Auto register all validators from assembly
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// CORS
var corsOrigins = configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:3000"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Necesario para SignalR
    });
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    
    // Política global: 100 requests por minuto por IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
    
    // Política "auth": 5 requests por minuto (para login)
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));
    
    // Política "password-reset": 3 requests por minuto (prevenir enumeración de emails)
    options.AddPolicy("password-reset", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(1)
            }));
});

builder.Services.AddAutoMapper(
    typeof(Sonirama.Api.Application.Users.Mapping.UserProfile),
    typeof(Sonirama.Api.Application.Products.Mapping.ProductProfile),
    typeof(Sonirama.Api.Application.Products.Discounts.Mapping.BulkDiscountProfile)
    , typeof(Sonirama.Api.Application.Categories.Mapping.CategoryProfile)
);

// EF Core PostgreSQL (Npgsql)
var connectionString = configuration.GetConnectionString("Default");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// Health Checks
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString!, name: "postgres", tags: ["db", "ready"]);

// Options
builder.Services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
builder.Services.Configure<AdminSeedOptions>(configuration.GetSection("AdminSeed"));
builder.Services.Configure<SmtpOptions>(configuration.GetSection("Smtp"));

// Identity util: Password hasher
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Repositorios
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IPasswordResetRequestRepository, PasswordResetRequestRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IBulkDiscountRepository, BulkDiscountRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IProductImageRepository, ProductImageRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();

// Servicios
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<DataSeeder>();

// Email: usar Console en desarrollo o cuando UseConsole=true, SMTP en producción
var smtpOptions = configuration.GetSection("Smtp").Get<SmtpOptions>();
if (smtpOptions?.UseConsole == true || builder.Environment.IsDevelopment())
{
    builder.Services.AddScoped<IEmailSender, ConsoleEmailSender>();
}
else
{
    builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
}

builder.Services.AddScoped<IPasswordGenerator, PasswordGenerator>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IBulkDiscountService, BulkDiscountService>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderNotificationService, OrderNotificationService>();
builder.Services.AddScoped<IProductImageStorage, ProductImageStorage>();
builder.Services.AddScoped<INotificationService, NotificationService>();

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
    // RequireHttpsMetadata: false solo en desarrollo, true en producción
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
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
    Log.Warning(ex, "No se pudo inicializar datos de la base de datos");
}

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Serilog request logging
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
});

app.UseHttpsRedirection();
app.UseStaticFiles();

// CORS debe ir antes de Authentication
app.UseCors("AllowFrontend");

// Rate Limiting
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Global exception handling (custom domain exceptions -> JSON)
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapControllers();
app.MapHub<OrdersHub>("/hubs/orders");

// Health check endpoints
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                duration = e.Value.Duration.TotalMilliseconds
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        });
        await context.Response.WriteAsync(result);
    }
});

await app.RunAsync();
