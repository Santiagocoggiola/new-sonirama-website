using System.Linq;
using Sonirama.Api.Application.Common.Interfaces;

namespace Sonirama.Api.Infrastructure.Security;

// Deterministic generator for development/testing (Playwright-friendly).
public sealed class DevPasswordGenerator : IPasswordGenerator
{
    private const string DefaultPassword = "DevPassword123!";
    private const string DefaultNumericCode = "111222";

    public string Generate(int length, bool includeSymbols = true)
    {
        // Return a stable password trimmed/padded to requested length
        if (length <= 0) return DefaultPassword;
        if (length == DefaultPassword.Length) return DefaultPassword;
        if (length < DefaultPassword.Length) return DefaultPassword[..length];

        // pad with 'A' to reach length
        return DefaultPassword + new string('A', length - DefaultPassword.Length);
    }

    public string GenerateNumericCode(int digits)
    {
        if (digits <= 0) return DefaultNumericCode;
        if (digits == DefaultNumericCode.Length) return DefaultNumericCode;
        if (digits < DefaultNumericCode.Length) return DefaultNumericCode[..digits];

        // repeat to reach requested length
        var repeats = (digits + DefaultNumericCode.Length - 1) / DefaultNumericCode.Length;
        var expanded = string.Concat(Enumerable.Repeat(DefaultNumericCode, repeats));
        return expanded[..digits];
    }
}
