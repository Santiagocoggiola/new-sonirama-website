using System.Text.Json;
using Sonirama.Api.Application.Common.Exceptions;

namespace Sonirama.Api.Infrastructure.Middleware;

// Middleware to translate domain exceptions to consistent JSON error responses (Spanish messages).
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException dex)
        {
            _logger.LogWarning(dex, "Domain error: {Message}", dex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = dex.StatusCode;

            var payload = dex switch
            {
                ValidationException v => (object)new { error = dex.Message, detalles = v.Errors },
                _ => (object)new { error = dex.Message }
            };

            var json = JsonSerializer.Serialize(payload);
            await context.Response.WriteAsync(json);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = 500;
            var json = JsonSerializer.Serialize(new { error = "Error interno del servidor" });
            await context.Response.WriteAsync(json);
        }
    }
}
