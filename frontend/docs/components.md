 # Geev Component Library

This document describes the base UI components used in the Geev design system.
All components are built using **shadcn/ui**, styled with **Tailwind CSS**, and
customized to match Geev’s design principles.

---

## Design Principles

- **Primary Color:** Orange (`hsl(20, 100%, 60%)`)
- **Flat Design:** No gradients, minimal shadows
- **Consistent Radius:** Rounded corners via Tailwind tokens
- **Accessible:** Keyboard navigation, ARIA-compliant
- **Theme Support:** Light and dark mode
- **Reusable:** All components live in `components/ui`

---

## Installation

Components are added using the shadcn/ui CLI:

```bash
npx shadcn@latest init
npx shadcn@latest add button input card badge avatar dialog dropdown-menu select textarea tabs label skeleton toast
```
## Button
Primary action component with multiple variants.

```bash
import { Button } from "@/components/ui/button"
```
```bash
<Button>Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button disabled>Disabled</Button>
```
## Input
Standard text input with flat styling.

```bash
import { Input } from "@/components/ui/input"
```
```bash
<Input placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input disabled placeholder="Disabled" />
```

## Card
Container component for grouping related content.

```bash
import { Card } from "@/components/ui/card"
```

```bash
<Card className="p-6 max-w-sm">
  Flat Geev card
</Card>
```

## Badge
Used for labels, tags, and status indicators.

```bash
import { Badge } from "@/components/ui/badge"
```

```bash
<Badge>Primary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
```

## Avatar
Displays user profile images with fallback support.

```bash
import { Avatar,AvatarImage,AvatarFallback } from "@/components/ui/avatar"
```

```bash
<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" />
  <AvatarFallback>SG</AvatarFallback>
</Avatar>
```

## Dialog
Modal dialog for confirmations and additional content.

```bash
import { Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
```

```bash
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Geev Dialog</DialogTitle>
    </DialogHeader>
    Dialog content goes here.
  </DialogContent>
</Dialog>
```

## Dropdown Menu
Contextual menu for actions.

```bash
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
```

```bash
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Select
Custom select dropdown component.

```bash
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
```

```bash
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="one">Option One</SelectItem>
    <SelectItem value="two">Option Two</SelectItem>
  </SelectContent>
</Select>
```

## Textarea
Multi-line text input.

```bash
import { Textarea } from "@/components/ui/textarea"
```

```bash
<Textarea placeholder="Write your message..." />
```
## Tabs
Switch between different content views.

```bash
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
```

```bash
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab One</TabsTrigger>
    <TabsTrigger value="tab2">Tab Two</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content One</TabsContent>
  <TabsContent value="tab2">Content Two</TabsContent>
</Tabs>
```


## Label
Accessible label for form fields.

```bash
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
```

```bash
<Label htmlFor="email">Email</Label>
<Input id="email" placeholder="Email" />
```

## Skeleton
Placeholder loading state.

```bash
import { Skeleton } from "@/components/ui/skeleton"
```

```bash
<Skeleton className="h-4 w-[200px]" />
<Skeleton className="h-10 w-full" />
```

## Toast (Sonner)
Non-blocking notifications.

```bash
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
```

```tsx
<Button onClick={() => toast("Action completed!")}>
  Show Toast
</Button>
```
