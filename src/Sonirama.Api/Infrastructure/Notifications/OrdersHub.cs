using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Sonirama.Api.Infrastructure.Extensions;

namespace Sonirama.Api.Infrastructure.Notifications;

[Authorize]
public sealed class OrdersHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.GetUserId();
        if (userId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, BuildUserGroup(userId.Value));
        }

        if (Context.User?.IsInRole("ADMIN") == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
        }

        await base.OnConnectedAsync();
    }

    public Task SubscribeToUser(Guid userId)
    {
        var callerId = Context.User?.GetUserId();
        var isAdmin = Context.User?.IsInRole("ADMIN") == true;
        if (!isAdmin && (!callerId.HasValue || callerId.Value != userId))
        {
            throw new HubException("Solo podés suscribirte a tus propios pedidos.");
        }

        return Groups.AddToGroupAsync(Context.ConnectionId, BuildUserGroup(userId));
    }

    public Task SubscribeToAdmins()
    {
        if (Context.User?.IsInRole("ADMIN") != true)
        {
            throw new HubException("Solo administradores pueden suscribirse al canal global");
        }

        return Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
    }

    internal const string AdminGroup = "admins";
    internal static string BuildUserGroup(Guid userId) => $"user:{userId}";
}
