import Link from "next/link";
import { Map, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-white/10 bg-slate-900/50">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                        <Map className="w-6 h-6 text-blue-400" />
                    </div>
                    <CardTitle className="text-xl text-white">Lost in Space?</CardTitle>
                    <CardDescription>
                        We couldn't find the coordinates you were looking for.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center text-4xl font-bold text-slate-700 font-mono my-4">
                        404
                    </div>
                    <Link href="/dashboard/patient" className="w-full block">
                        <Button className="w-full" variant="default">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Return to Mission Control
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
