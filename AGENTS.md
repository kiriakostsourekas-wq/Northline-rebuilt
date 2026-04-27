<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Northline Rebuild Rules

- This repository is the new Northline rebuild, not the existing production project.
- Do not modify the live `northline.ai` production domain or production Vercel project during development.
- Use preview deployments only until a launch/cutover task is explicitly planned.
- Keep Greek and English as first-class product languages.
- Use TypeScript, Next.js App Router, Prisma, PostgreSQL, and tested business logic.
