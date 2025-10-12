# new-sonirama-website

A modern web application built with .NET 9 and React (Vite) with TypeScript.

## Project Structure

```
.
├── Sonirama.sln              # .NET Solution file
├── src/
│   └── Sonirama.Api/         # .NET Web API project
│       ├── Program.cs
│       ├── Sonirama.Api.csproj
│       └── ...
└── webapp/                   # Vite + React + TypeScript frontend
    ├── src/
    ├── public/
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v20 or later)
- npm (comes with Node.js)

## Getting Started

### Backend (.NET API)

```bash
# Restore dependencies and build
dotnet restore
dotnet build

# Run the API
cd src/Sonirama.Api
dotnet run
```

The API will be available at `https://localhost:5001` (or the port shown in the console).

### Frontend (React + Vite)

```bash
# Navigate to webapp directory
cd webapp

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in the console).

## Building for Production

### Backend

```bash
dotnet publish -c Release
```

### Frontend

```bash
cd webapp
npm run build
```

The production build will be in the `webapp/dist` folder.