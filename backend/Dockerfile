# Build context: Render root directory `backend/` (default).
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY PrintForge.Api/PrintForge.Api.csproj PrintForge.Api/
COPY PrintForge.Services/PrintForge.Services.csproj PrintForge.Services/
COPY PrintForge.Repositories/PrintForge.Repositories.csproj PrintForge.Repositories/
COPY PrintForge.Infrastructure/PrintForge.Infrastructure.csproj PrintForge.Infrastructure/
COPY PrintForge.Models/PrintForge.Models.csproj PrintForge.Models/
COPY PrintForge.Constants/PrintForge.Constants.csproj PrintForge.Constants/

RUN dotnet restore PrintForge.Api/PrintForge.Api.csproj

COPY . .
RUN dotnet publish PrintForge.Api/PrintForge.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
# Disable appsettings.json file watchers (Render inotify limit = 128).
ENV hostBuilder__reloadConfigOnChange=false
ENV DOTNET_hostBuilder__reloadConfigOnChange=false
ENV ASPNETCORE_hostBuilder__reloadConfigOnChange=false
ENV DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "PrintForge.Api.dll"]
