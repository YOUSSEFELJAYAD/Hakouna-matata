"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Dashboard Page
 * User dashboard with stats and quick actions
 * Access control: Requires authentication
 */
export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your dashboard. Here's an overview of your account.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Active users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">1,234</p>
            <p className="text-sm text-muted-foreground mt-2">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Total revenue this month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">$45,231</p>
            <p className="text-sm text-muted-foreground mt-2">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Currently active sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">573</p>
            <p className="text-sm text-muted-foreground mt-2">+3% from last hour</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">User Registration</p>
                <p className="text-sm text-muted-foreground">New user signed up</p>
              </div>
              <span className="text-sm text-muted-foreground">2 min ago</span>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">Payment Received</p>
                <p className="text-sm text-muted-foreground">$129.00 from John Doe</p>
              </div>
              <span className="text-sm text-muted-foreground">15 min ago</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Profile Updated</p>
                <p className="text-sm text-muted-foreground">User updated their profile</p>
              </div>
              <span className="text-sm text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
