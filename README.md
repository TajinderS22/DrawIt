# ✏️ DrawIt - Real-time Collaborative Whiteboard

[![GitHub](https://img.shields.io/badge/GitHub-DrawIt-blue?logo=github)](https://github.com/TajinderS22/drawit)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

DrawIt is a modern, open-source, real-time collaborative whiteboard tool built with Next.js and WebSockets. Design, sketch, and brainstorm ideas with your team directly in the browser — no installations required.

## ✨ Features

- 🧑‍🤝‍🧑 **Real-time Collaboration** - Work with your team live with instant updates
- 🎨 **Smart Drawing Tools** - Draw shapes, arrows, and text with precision
- 💾 **Autosave** - All sketches are automatically saved and synced
- 📦 **Open Source** - Free and extensible, self-host or contribute
- ⚡ **Lightning Fast** - Optimized performance with smooth interactions
- 🌐 **Lightweight** - No bloat, works in any modern browser
- 📥 **Export Canvas** - Download your drawings as PNG images

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/pnpm/yarn
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/TajinderS22/drawit.git
cd DrawIt
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Run the development server:

```bash
pnpm run dev
```

Visit `http://localhost:3000` in your browser.

## 📁 Project Structure

This is a monorepo using [Turborepo](https://turborepo.com/) with the following structure:

```
DrawIt/
├── apps/
│   ├── http-backend/        # REST API Server
│   ├── web/                 # Next.js Frontend
│   └── ws-backend/          # WebSocket Server for real-time sync
├── packages/
│   ├── db/                  # Prisma database configuration
│   ├── backend-common/      # Shared backend utilities
│   ├── ui/                  # Shared React UI components
│   ├── eslint-config/       # Shared ESLint configuration
│   └── typescript-config/   # Shared TypeScript configuration
└── turbo.json              # Turborepo configuration
```

### Apps and Packages

- **`web`** - Next.js frontend application with canvas drawing interface
- **`http-backend`** - Express.js REST API for authentication and data management
- **`ws-backend`** - WebSocket server for real-time collaboration features
- **`db`** - Prisma schema and database migrations
- **`@repo/ui`** - Reusable React components (Button, Input, Alert, Card, etc.)
- **`@repo/backend-common`** - Shared utilities and middleware for backends
- **`@repo/eslint-config`** - ESLint configurations for different project types
- **`@repo/typescript-config`** - TypeScript configurations for different project types

## 🛠️ Tech Stack

### Frontend

- [Next.js](https://nextjs.org/) - React framework with App Router
- [React](https://react.dev/) - UI library
- [Redux](https://redux.js.org/) - State management
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [Socket.io](https://socket.io/) - Real-time communication

### Backend

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express.js](https://expressjs.com/) - Web framework
- [Prisma](https://www.prisma.io/) - ORM for database
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Real-time sync

### DevOps & Tools

- [TypeScript](https://www.typescriptlang.org/) - Static type checking
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting
- [Turborepo](https://turborepo.com/) - Monorepo build system

## 🔧 Development

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

### Develop

To start development on all services:

```bash
pnpm run dev
```

This will start:

- Next.js frontend on `http://localhost:3000`
- HTTP backend on `http://localhost:5000`
- WebSocket server on `http://localhost:5001`

To develop a specific app:

```bash
# Frontend only
turbo dev --filter=web

# Backend API only
turbo dev --filter=http-backend

# WebSocket server only
turbo dev --filter=ws-backend
```

## 🎨 How to Use

### Drawing Tools

1. **Pencil** - Free-hand drawing
2. **Rectangle** - Draw rectangular shapes
3. **Circle** - Draw circular shapes
4. **Eraser** - Erase drawn content
5. **Select** - Select and move objects
6. **Download** - Export canvas as PNG image

### Collaboration

1. Create or join a room through the dashboard
2. Share the room link with your team
3. Start drawing in real-time
4. All changes are instantly synced across connected users

## 📚 API Documentation

### HTTP Backend (`/apps/http-backend`)

- **Authentication** - User signin/signup endpoints
- **Room Management** - Create and list drawing rooms
- **User Verification** - JWT token validation

### WebSocket Backend (`/apps/ws-backend`)

- **Real-time Drawing** - Synchronize canvas strokes
- **Room Events** - User join/leave events
- **Message Broadcasting** - Distribute drawing updates to all clients

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:

- Code follows the existing style (ESLint + Prettier)
- All tests pass
- Changes are well-documented

## 📋 Available Scripts

### Root Level (Turborepo)

```bash
pnpm run dev        # Start all services in development mode
pnpm run build      # Build all apps and packages
pnpm run lint       # Run ESLint on all packages
pnpm run test       # Run tests across the monorepo
```

### Frontend (`apps/web`)

```bash
cd apps/web
pnpm run dev        # Start Next.js dev server
pnpm run build      # Build for production
pnpm run lint       # Run ESLint
pnpm run start      # Start production server
```

### HTTP Backend (`apps/http-backend`)

```bash
cd apps/http-backend
pnpm run dev        # Start development server with hot reload
pnpm run build      # Build TypeScript
pnpm run start      # Start production server
```

### WebSocket Backend (`apps/ws-backend`)

```bash
cd apps/ws-backend
pnpm run dev        # Start WebSocket server
pnpm run build      # Build TypeScript
pnpm run start      # Start production server
```

## 🗄️ Database

DrawIt uses [Prisma](https://www.prisma.io/) for database management.

### Setup Database

```bash
cd packages/db
pnpm prisma migrate dev --name init    # Run migrations
pnpm prisma studio                     # Open Prisma Studio UI
```

### Schema

The database schema is defined in `packages/db/prisma/schema.prisma`. Key models:

- **User** - User accounts and authentication
- **Room** - Drawing rooms/canvases
- **Canvas** - Canvas content and metadata

## 🐛 Troubleshooting

### WebSocket Connection Issues

- Ensure the WebSocket server is running (`ws-backend`)
- Check if the port (5001) is not blocked by firewall
- Verify the browser console for connection errors

### Build Failures

- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear Turborepo cache: `turbo prune --scope=web`

### Database Issues

- Reset database: `prisma db push --skip-generate`
- Check `.env.local` has correct `DATABASE_URL`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Real-time sync powered by [WebSockets](https://socket.io/)
- State management with [Redux](https://redux.js.org/)
- Database ORM by [Prisma](https://www.prisma.io/)
- Monorepo tooling with [Turborepo](https://turborepo.com/)

## 📞 Support

For questions or issues:

- Open a [GitHub Issue](https://github.com/TajinderS22/drawit/issues)
- Check existing documentation
- Join discussions in the repository

---

Made with ❤️ by the DrawIt Team
