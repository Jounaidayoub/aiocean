import { LoginForm } from "../components/login-form"

export function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-6 md:p-10 font-sans text-foreground">
            <div className="w-full max-w-sm md:max-w-3xl">
                <LoginForm />
            </div>
        </div>
    )
}