using Microsoft.AspNetCore.Mvc;
using PrintForge.Api.Authorization;
using PrintForge.Models.DTOs;
using PrintForge.Services.Interfaces;

namespace PrintForge.Api.Controllers;

[ApiController]
[Route("api")]
public class RbacController(IRbacService rbac, IPermissionService permissions) : ControllerBase
{
    [HttpGet("users/permissions/me")]
    [UserAuthorize]
    public async Task<IActionResult> MyPermissions()
    {
        var user = HttpContext.GetRequiredUser();
        var perms = await rbac.MyPermissionsAsync(user.Id);
        return Ok(ApiResponse<object>.Success(perms));
    }

    [HttpGet("users/")]
    [AdminAuthorize]
    public async Task<IActionResult> ListUsers()
    {
        var users = await rbac.ListUsersAsync();
        return Ok(ApiResponse<object>.Success(users));
    }

    [HttpGet("users/permissions")]
    [AdminAuthorize]
    public async Task<IActionResult> GetUserPermissions([FromQuery] string uuid)
    {
        try
        {
            var result = await rbac.GetUserPermissionsAsync(uuid);
            return Ok(ApiResponse<object>.Success(result));
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "User not found" }); }
    }

    [HttpPut("users/permissions")]
    [AdminAuthorize]
    public async Task<IActionResult> UpdateUserPermissions([FromQuery] string uuid, [FromBody] RolePermissionsRequest request)
    {
        try
        {
            var result = await rbac.UpdateUserPermissionsAsync(uuid, request);
            return Ok(ApiResponse<object>.Success(result));
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "User not found" }); }
    }

    [HttpGet("modules/")]
    [AdminAuthorize]
    public async Task<IActionResult> ListModules()
    {
        var mods = await rbac.ListModulesAsync();
        return Ok(ApiResponse<object>.Success(mods));
    }

    [HttpGet("roles/")]
    [AdminAuthorize]
    public async Task<IActionResult> ListRoles()
    {
        var roles = await rbac.ListRolesAsync();
        return Ok(ApiResponse<object>.Success(roles));
    }

    [HttpPost("roles/")]
    [AdminAuthorize]
    public async Task<IActionResult> CreateRole([FromBody] RoleRequest request)
    {
        var role = await rbac.CreateRoleAsync(request);
        return Ok(ApiResponse<object>.Success(role));
    }

    [HttpGet("roles/{roleId}")]
    [AdminAuthorize]
    public async Task<IActionResult> GetRole(string roleId)
    {
        try
        {
            var role = await rbac.GetRoleAsync(roleId);
            return Ok(ApiResponse<object>.Success(role));
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Role not found" }); }
    }

    [HttpPatch("roles/{roleId}")]
    [AdminAuthorize]
    public async Task<IActionResult> UpdateRole(string roleId, [FromBody] Dictionary<string, object?> payload)
    {
        try
        {
            var role = await rbac.UpdateRoleAsync(roleId, payload);
            return Ok(ApiResponse<object>.Success(role));
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Role not found" }); }
    }

    [HttpDelete("roles/{roleId}")]
    [AdminAuthorize]
    public async Task<IActionResult> DeleteRole(string roleId)
    {
        try
        {
            var result = await rbac.DeleteRoleAsync(roleId);
            return Ok(ApiResponse<object>.Success(result));
        }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpPut("roles/{roleId}/permissions")]
    [AdminAuthorize]
    public async Task<IActionResult> UpdateRolePermissions(string roleId, [FromBody] RolePermissionsRequest request)
    {
        try
        {
            var perms = await rbac.UpdateRolePermissionsAsync(roleId, request);
            return Ok(ApiResponse<object>.Success(perms));
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Role not found" }); }
    }

    [HttpPost("reloadPermissions")]
    public IActionResult ReloadPermissions()
    {
        permissions.InvalidateCache();
        return Ok(ApiResponse<object>.Success(new { ok = true }));
    }
}
