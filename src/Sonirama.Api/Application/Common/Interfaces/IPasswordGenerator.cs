namespace Sonirama.Api.Application.Common.Interfaces;

// Random password generator abstraction.
public interface IPasswordGenerator
{
    string Generate(int length, bool includeSymbols = true);
    string GenerateNumericCode(int digits);
}
