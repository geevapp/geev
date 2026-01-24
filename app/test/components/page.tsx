import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function ComponentsShowcase() {
    return (
        <div className="mx-auto max-w-5xl px-6 py-12 space-y-12 bg-background text-foreground">

            <section className="space-y-4 rounded-lg border border-border p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold tracking-tight">Theme System</h2>
                    <ThemeToggle />
                </div>
                <p className="text-sm text-muted-foreground">
                    Click the theme toggle in the top right to switch between light and dark modes. 
                    The preference is automatically saved and will persist across page refreshes.
                </p>
            </section>

            <section className="space-y-4 rounded-lg border border-border p-6">
                <h2 className="text-base font-semibold tracking-tight">Buttons</h2>
                <div className="flex gap-4 flex-wrap">
                    <Button>Primary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold">Inputs</h2>
                <Input placeholder="Email" />
            </section>

            <section>
                <h2 className="text-2xl font-semibold">Badges</h2>
                <div className="flex gap-2">
                    <Badge>Primary</Badge>
                    <Badge variant="outline">Outline</Badge>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold">Card</h2>
                <Card className="p-6 max-w-sm">
                    Flat Geev card - notice how it adapts to the current theme
                </Card>
            </section>

            <section>
                <h2 className="text-2xl font-semibold">Theme Demo Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold mb-2">Light Mode</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This card uses dark: prefixes for proper theme support
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold mb-2">Alternative Colors</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            All colors meet WCAG AA contrast standards
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold">Dialog</h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Geev Dialog</DialogTitle>
                        </DialogHeader>
                        <p>This dialog also respects the current theme setting</p>
                    </DialogContent>
                </Dialog>
            </section>

        </div>
    )
}
