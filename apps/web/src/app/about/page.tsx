import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * About Page
 * Information about the project and technology stack
 */
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About Hakouna Matata</h1>

        <div className="prose prose-lg mb-12">
          <p className="text-lg text-muted-foreground">
            Hakouna Matata is a comprehensive, enterprise-grade multi-platform demo
            application designed to showcase modern development best practices and
            cutting-edge technologies across web, mobile, and backend platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Web Application</CardTitle>
              <CardDescription>Next.js 16 with TypeScript</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Next.js 16 with App Router</li>
                <li>✓ TanStack Query & Router</li>
                <li>✓ shadcn/ui Components</li>
                <li>✓ tRPC Type-safe APIs</li>
                <li>✓ Prisma ORM</li>
                <li>✓ BetterAuth Authentication</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Android Application</CardTitle>
              <CardDescription>Jetpack Compose with Kotlin</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Jetpack Compose UI</li>
                <li>✓ Orbit Compose Components</li>
                <li>✓ Dagger Hilt DI</li>
                <li>✓ Retrofit Networking</li>
                <li>✓ Firebase Integration</li>
                <li>✓ Navigation Component</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Go Backend</CardTitle>
              <CardDescription>Clean Architecture</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Clean Architecture Pattern</li>
                <li>✓ Domain-Driven Design</li>
                <li>✓ Repository Pattern</li>
                <li>✓ Dependency Injection</li>
                <li>✓ JWT Authentication</li>
                <li>✓ PostgreSQL & MongoDB</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Node.js Backend</CardTitle>
              <CardDescription>Layered Architecture</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Express.js Framework</li>
                <li>✓ TypeScript Support</li>
                <li>✓ Service Layer Pattern</li>
                <li>✓ Prisma ORM</li>
                <li>✓ Rate Limiting</li>
                <li>✓ API Documentation</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enterprise Features</CardTitle>
            <CardDescription>Production-ready capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Security</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• PCI-DSS Compliance</li>
                  <li>• Role-based Access Control</li>
                  <li>• Audit Logging</li>
                  <li>• Rate Limiting</li>
                  <li>• HTTPS/TLS Encryption</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Developer Experience</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• TypeScript Type Safety</li>
                  <li>• Monorepo with Turborepo</li>
                  <li>• ESLint & Prettier</li>
                  <li>• Husky Pre-commit Hooks</li>
                  <li>• Comprehensive Documentation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
