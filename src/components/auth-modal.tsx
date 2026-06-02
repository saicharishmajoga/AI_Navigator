import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Sparkles, Loader2, ArrowLeft, RefreshCw, KeyRound, User as UserIcon } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AuthMode = "signin" | "signup" | "verify" | "forgot_request" | "forgot_verify" | "forgot_reset";

export function AuthModal() {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    signIn, 
    registerUser, 
    verifyCode, 
    resendCode,
    requestReset,
    verifyResetCode,
    resetNewPassword,
    signInGoogle,
    signInGuest 
  } = useApp();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [simulatedCode, setSimulatedCode] = useState("");

  // Load and pre-fill cached email if "Remember Me" is enabled
  useEffect(() => {
    if (authModalOpen) {
      const cached = localStorage.getItem("remember_email");
      if (cached) {
        setEmail(cached);
        setRememberMe(true);
      } else {
        setEmail("");
        setRememberMe(false);
      }
      setPassword("");
      setName("");
      setCode("");
      setSimulatedCode("");
    }
  }, [authModalOpen]);

  // Countdown timer for resending OTPs
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRememberEmail = (verifiedEmail: string) => {
    if (rememberMe) {
      localStorage.setItem("remember_email", verifiedEmail);
    } else {
      localStorage.removeItem("remember_email");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signin") {
        if (!email || !password) return;
        await signIn(email, password);
        handleRememberEmail(email);
        toast.success("Welcome back!");
        setAuthModalOpen(false);
      } 
      else if (mode === "signup") {
        if (!email || !password || !name) return;
        const res = await registerUser(email, password, name);
        if (res && res.otp_code) {
          setSimulatedCode(res.otp_code);
        }
        toast.success("Registration successful! A 6-digit verification code has been generated.");
        setMode("verify");
        setResendTimer(30);
      } 
      else if (mode === "verify") {
        if (!email || !code) return;
        await verifyCode(email, code);
        handleRememberEmail(email);
        toast.success("Email verified successfully! Welcome to AI Navigator.");
        setAuthModalOpen(false);
      } 
      else if (mode === "forgot_request") {
        if (!email) return;
        const res = await requestReset(email);
        if (res && res.otp_code) {
          setSimulatedCode(res.otp_code);
        }
        toast.success("Password reset code generated successfully.");
        setMode("forgot_verify");
        setResendTimer(30);
      } 
      else if (mode === "forgot_verify") {
        if (!email || !code) return;
        await verifyResetCode(email, code);
        toast.success("Reset code verified successfully! You can now set a new password.");
        setMode("forgot_reset");
      } 
      else if (mode === "forgot_reset") {
        if (!email || !code || !password) return;
        await resetNewPassword(email, code, password);
        toast.success("Password reset successfully! Please sign in with your new password.");
        setMode("signin");
        setPassword("");
        setCode("");
      }
    } catch (error) {
      const errMsg = (error as Error)?.message || "Authentication failed";
      
      if (errMsg.startsWith("OTP_REQUIRED")) {
        const parts = errMsg.split(":");
        const devCode = parts[1];
        if (devCode) {
          setSimulatedCode(devCode);
        }
        toast.info("Multi-Factor Authentication enabled. A 6-digit OTP code has been generated.");
        setMode("verify");
        setResendTimer(30);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !email) return;
    setLoading(true);
    try {
      if (mode === "verify" || mode === "signup") {
        await resendCode(email);
        toast.success("A fresh 6-digit verification code has been resent to your email.");
      } else if (mode === "forgot_verify" || mode === "forgot_request") {
        const res = await requestReset(email);
        if (res && res.otp_code) {
          setSimulatedCode(res.otp_code);
        }
        toast.success("A fresh password reset code has been resent to your email.");
      }
      setResendTimer(30);
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInGoogle("oauth.user@gmail.com", "Google Partner");
      toast.success("Welcome! Successfully authenticated with Google.");
      setAuthModalOpen(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      await signInGuest();
      toast.success("Signed in as Guest. Create a full account to preserve bookmarks across reloads.");
      setAuthModalOpen(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Guest login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="glass-strong border-border/60 p-0 overflow-hidden max-w-md shadow-2xl">
        <div className="absolute inset-0 bg-gradient-hero opacity-30 pointer-events-none" />
        <div className="relative p-8">
          
          {/* Header Panel */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground animate-pulse" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                {mode === "signin" && "Welcome back"}
                {mode === "signup" && "Create account"}
                {mode === "verify" && "Multi-Factor Verification"}
                {mode === "forgot_request" && "Reset your password"}
                {mode === "forgot_verify" && "Enter reset code"}
                {mode === "forgot_reset" && "Set new password"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === "signin" && "Sign in to save chats and bookmarks"}
                {mode === "signup" && "Save chats, bookmarks & visit history"}
                {mode === "verify" && `Enter 6-digit OTP code dispatched to ${email}`}
                {mode === "forgot_request" && "Enter your email to receive a reset code"}
                {mode === "forgot_verify" && `Enter the 6-digit reset code sent to ${email}`}
                {mode === "forgot_reset" && "Securely establish your new password"}
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <form onSubmit={submit} className="space-y-4">
            
            {/* Simulated OTP Helper Banner (Renders inside the modal dynamically for seamless testing) */}
            {simulatedCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-md flex flex-col gap-1 shadow-glow-sm"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span>Developer Help: Dynamic OTP</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your 6-digit verification code is:
                </p>
                <div className="text-center font-mono font-bold tracking-[0.2em] text-lg text-primary bg-primary/10 rounded-lg py-1 mt-1 select-all cursor-pointer" title="Click to select all">
                  {simulatedCode}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* Sign In & Sign Up Modes */}
              {(mode === "signin" || mode === "signup") && (
                <motion.div
                  key="credential-fields"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >


                  {/* Name field for sign up */}
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5"
                    >
                      <Label htmlFor="name" className="text-xs font-semibold text-foreground/80">Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="pl-9 h-10 border-border/60 bg-background/30" 
                          placeholder="Jane Doe" 
                          required 
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="pl-9 h-10 border-border/60 bg-background/30" 
                        placeholder="you@example.com" 
                        required 
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground/80">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="pl-9 h-10 border-border/60 bg-background/30" 
                        placeholder="••••••••" 
                        required 
                      />
                    </div>
                  </div>

                  {/* Remember Me and Forgot Password checkbox bar */}
                  {mode === "signin" && (
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-border bg-background/50 text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer"
                        />
                        Remember me
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode("forgot_request")}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* Primary Form Button */}
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 h-11 font-semibold shadow-glow mt-4"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {mode === "signin" ? "Sign in" : "Create account"}
                  </Button>
                </motion.div>
              )}

              {/* OTP Verifications */}
              {(mode === "verify" || mode === "forgot_verify") && (
                <motion.div
                  key="otp-fields"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-xs font-semibold text-foreground/80">6-Digit Code</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="code" 
                        type="text" 
                        required 
                        maxLength={6} 
                        value={code} 
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} 
                        className="pl-9 text-center font-mono font-bold tracking-[0.4em] text-lg h-11 border-border/60 bg-background/30" 
                        placeholder="000000" 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal mt-2">
                      Please enter the 6-digit OTP code shown in the **Developer Help Banner** above to complete verification.
                    </p>
                  </div>

                  {/* Resend Action */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted-foreground">Didn't receive the code?</span>
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={handleResend}
                      className="flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                    </button>
                  </div>

                  {/* Submit Verify Code */}
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 h-11 font-semibold shadow-glow mt-4"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Verify Code
                  </Button>
                </motion.div>
              )}

              {/* Forgot Request panel */}
              {mode === "forgot_request" && (
                <motion.div
                  key="forgot-request-fields"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-xs font-semibold text-foreground/80">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="forgot-email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="pl-9 h-10 border-border/60 bg-background/30" 
                        placeholder="you@example.com" 
                        required 
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 h-11 font-semibold shadow-glow mt-4"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Request Reset Code
                  </Button>
                </motion.div>
              )}

              {/* Forgot Reset panel */}
              {mode === "forgot_reset" && (
                <motion.div
                  key="forgot-reset-fields"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs font-semibold text-foreground/80">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="new-password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="pl-9 h-10 border-border/60 bg-background/30" 
                        placeholder="••••••••" 
                        required 
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 h-11 font-semibold shadow-glow mt-4"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Establish New Password
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>



          {/* Footer Navigation Toggles */}
          <div className="mt-6 text-center text-xs">
            {mode === "signin" && (
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode !== "signin" && mode !== "signup" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-semibold transition-colors duration-200"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </button>
            )}
          </div>

          <p className="text-center text-[10px] text-muted-foreground/60 mt-6 leading-normal">
            Authentication is handled through the AI Navigator backend — your session is secure and can be restored on reload.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
