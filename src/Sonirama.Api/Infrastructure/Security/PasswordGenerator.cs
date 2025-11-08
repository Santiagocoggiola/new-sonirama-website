using System.Security.Cryptography;
using System.Text;
using Sonirama.Api.Application.Common.Interfaces;

namespace Sonirama.Api.Infrastructure.Security;

// Cryptographically-strong password generator.
public sealed class PasswordGenerator : IPasswordGenerator
{
    private static readonly char[] Letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray();
    private static readonly char[] Digits = "0123456789".ToCharArray();
    private static readonly char[] Symbols = "!@#$%^&*()-_=+[]{};:,.?".ToCharArray();

    public string Generate(int length, bool includeSymbols = true)
    {
        var pool = new List<char>();
        pool.AddRange(Letters);
        pool.AddRange(Digits);
        if (includeSymbols) pool.AddRange(Symbols);

        var bytes = RandomNumberGenerator.GetBytes(length);
        var sb = new StringBuilder(length);
        for (int i = 0; i < length; i++)
        {
            sb.Append(pool[bytes[i] % pool.Count]);
        }
        return sb.ToString();
    }

    public string GenerateNumericCode(int digits)
    {
        var bytes = RandomNumberGenerator.GetBytes(digits);
        var sb = new StringBuilder(digits);
        for (int i = 0; i < digits; i++)
        {
            sb.Append((bytes[i] % 10).ToString());
        }
        return sb.ToString();
    }
}
