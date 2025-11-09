import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Home Page
 * Landing page with feature highlights
 */
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Welcome to Hakouna Matata</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          An enterprise-grade, multi-platform demo application showcasing modern web
          development best practices with Next.js, Android, Go, and Node.js
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-6 mb-16">
        <Card>
          <CardHeader>
            <CardTitle>Enterprise Security</CardTitle>
            <CardDescription>PCI-DSS compliant and payment-ready</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Built with enterprise-grade security features including role-based access
              control, audit logging, and secure session management.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modern Tech Stack</CardTitle>
            <CardDescription>Latest technologies and best practices</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Powered by Next.js 16, TypeScript, tRPC, Prisma, TanStack Query, and
              shadcn/ui for a seamless developer experience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multi-Platform</CardTitle>
            <CardDescription>Web, Mobile, and Backend</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete solution with Next.js web app, Android mobile app, and backend
              services in both Go and Node.js.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Tech Stack Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-8">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">Next.js 16</p>
            <p className="text-sm text-muted-foreground">Web Framework</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">TypeScript</p>
            <p className="text-sm text-muted-foreground">Type Safety</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">tRPC</p>
            <p className="text-sm text-muted-foreground">Type-safe APIs</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">Prisma</p>
            <p className="text-sm text-muted-foreground">Database ORM</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">BetterAuth</p>
            <p className="text-sm text-muted-foreground">Authentication</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">TailwindCSS</p>
            <p className="text-sm text-muted-foreground">Styling</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">Firebase</p>
            <p className="text-sm text-muted-foreground">Backend Services</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">Turborepo</p>
            <p className="text-sm text-muted-foreground">Monorepo</p>
          </div>
        </div>
      </section>
    </div>
  );
}
