import React from "react"
import { MediaUpload } from "@/components/media-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
                    Flat Geev card
                </Card>
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
                        Flat dialog content
                    </DialogContent>
                </Dialog>
            </section>


            <section className="space-y-4 rounded-lg border border-border p-6">
                <h2 className="text-base font-semibold tracking-tight">Media Upload</h2>
                <div className="max-w-xl">
                    <MediaUploadWrapper />
                </div>
            </section>

        </div>
    )
}

function MediaUploadWrapper() {
    const [files, setFiles] = React.useState<any[]>([])
    return (
        <div className="space-y-4">
             <MediaUpload 
                onChange={(files) => {
                    console.log('Files changed:', files)
                    setFiles(files)
                }}
             />
             <div className="text-xs text-muted-foreground">
                Files count: {files.length}
             </div>
        </div>
    )
}
