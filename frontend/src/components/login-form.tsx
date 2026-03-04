import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
    onSubmit: (e: React.FormEvent) => void;
    username: string;
    setUsername: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    loading: boolean;
    error: string;
}

export function LoginForm({
  className,
  onSubmit,
  username,
  setUsername,
  password,
  setPassword,
  loading,
  error,
  ...props
}: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-white/40 backdrop-blur-3xl border-white/60 shadow-none rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Welcome Back</CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            Portal Access Required
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={onSubmit}>
            <div className="grid gap-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest text-center">
                  {error}
                </div>
              )}
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Username / Register ID</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter ID"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-14 bg-white/50 border-white/80 rounded-2xl focus-visible:ring-blue-500/20"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Security Key</Label>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-white/50 border-white/80 rounded-2xl focus-visible:ring-blue-500/20"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] italic rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="animate-spin" /> : "Establish Session"}
                </Button>
              </div>
              <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Assessment Node: MP-2026-X
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-[9px] font-bold uppercase tracking-widest text-slate-400/60 transition-opacity hover:opacity-100">
        Unauthorized access is strictly monitored by the HR Telemetry System.
      </div>
    </div>
  )
}
