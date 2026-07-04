# Build context must be the repo root (app/) so ../../supabase paths resolve during compile.
# Render: set dockerContext to . (repo root) and dockerfilePath to backend/Dockerfile.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/PrintForge.Api/PrintForge.Api.csproj backend/PrintForge.Api/
COPY backend/PrintForge.Services/PrintForge.Services.csproj backend/PrintForge.Services/
COPY backend/PrintForge.Repositories/PrintForge.Repositories.csproj backend/PrintForge.Repositories/
COPY backend/PrintForge.Infrastructure/PrintForge.Infrastructure.csproj backend/PrintForge.Infrastructure/
COPY backend/PrintForge.Models/PrintForge.Models.csproj backend/PrintForge.Models/
COPY backend/PrintForge.Constants/PrintForge.Constants.csproj backend/PrintForge.Constants/

RUN dotnet restore backend/PrintForge.Api/PrintForge.Api.csproj

COPY backend/ ./backend/
COPY supabase/ ./supabase/

WORKDIR /src/backend
RUN dotnet publish PrintForge.Api/PrintForge.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "PrintForge.Api.dll"]
