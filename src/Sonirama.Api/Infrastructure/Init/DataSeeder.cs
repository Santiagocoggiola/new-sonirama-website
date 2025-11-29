using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Infrastructure.Init;

public sealed class DataSeeder(
    AppDbContext db,
    IOptions<AdminSeedOptions> adminOptions,
    IPasswordHasher<User> passwordHasher
)
{
    public async Task InitializeAsync(CancellationToken ct = default)
    {
        var opts = adminOptions.Value;
        if (string.IsNullOrWhiteSpace(opts.Email) || string.IsNullOrWhiteSpace(opts.Password))
            return;

        var exists = await db.Users.AnyAsync(u => u.Email == opts.Email, ct);
        if (exists) return;

        var admin = new User
        {
            Email = opts.Email,
            Role = Role.IsValid(opts.Role) ? opts.Role : Role.Admin,
            FirstName = opts.FirstName,
            LastName = opts.LastName,
            IsActive = true
        };
        admin.PasswordHash = passwordHasher.HashPassword(admin, opts.Password);

        db.Users.Add(admin);
        await db.SaveChangesAsync(ct);
    }
}
