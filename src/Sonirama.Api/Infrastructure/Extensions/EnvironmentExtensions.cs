namespace Sonirama.Api.Infrastructure.Extensions;

/// <summary>
/// Helper to load environment variables from .env file in development.
/// </summary>
public static class EnvironmentExtensions
{
    /// <summary>
    /// Loads environment variables from .env file if it exists.
    /// Variables are loaded into Environment.SetEnvironmentVariable.
    /// </summary>
    public static void LoadDotEnv(string basePath)
    {
        var envFile = Path.Combine(basePath, ".env");
        if (!File.Exists(envFile))
        {
            Console.WriteLine("[INFO] No .env file found, using system environment variables and appsettings.");
            return;
        }

        Console.WriteLine("[INFO] Loading environment variables from .env file...");
        
        foreach (var line in File.ReadAllLines(envFile))
        {
            // Skip empty lines and comments
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#'))
                continue;

            var separatorIndex = trimmed.IndexOf('=');
            if (separatorIndex <= 0)
                continue;

            var key = trimmed[..separatorIndex].Trim();
            var value = trimmed[(separatorIndex + 1)..].Trim();

            // Remove surrounding quotes if present
            if ((value.StartsWith('"') && value.EndsWith('"')) ||
                (value.StartsWith('\'') && value.EndsWith('\'')))
            {
                value = value[1..^1];
            }

            // Only set if not already set (system env vars take precedence)
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}
