import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  MessageSquare,
  ChevronRight,
  Clock,
  Copy,
  Check,
  Terminal,
  BookOpen,
  Cpu,
  HelpCircle,
  Activity,
  Layers,
  Star,
  CheckCircle2,
  XCircle,
  Info,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Calendar,
  Building,
  User,
  GraduationCap,
  Briefcase,
  Megaphone,
  Youtube,
  Users
} from "lucide-react";
import { TOOLS, type AITool } from "@/lib/mock-data";
import { TOOL_DETAILS, type RichToolDetails } from "@/lib/tool-details";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/app-context";
import { useChat } from "@/contexts/chat-context";

export const Route = createFileRoute("/tools/$slug")({
  loader: ({ params }) => {
    const tool = TOOLS.find((t) => t.slug === params.slug);
    if (!tool) throw notFound();
    return { tool: tool as (typeof TOOLS)[number] };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const rich = TOOL_DETAILS[loaderData.tool.slug];
    const metaTitle = rich ? rich.seoContent.metaTitle : `${loaderData.tool.name} — AI Navigator`;
    const metaDesc = rich ? rich.seoContent.metaDescription : loaderData.tool.tagline;
    const keywords = rich ? [...rich.seoContent.topKeywords, ...rich.seoContent.bestAlternativesKeywords, ...rich.seoContent.compKeywords].join(", ") : "";
    return {
      meta: [
        { title: metaTitle },
        { name: "description", content: metaDesc },
        { name: "keywords", content: keywords }
      ]
    };
  },
  component: ToolDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Tool not found</h1>
      <Button asChild className="mt-6"><Link to="/tools">Browse all tools</Link></Button>
    </div>
  ),
});

function ToolDetail() {
  const { tool } = Route.useLoaderData() as { tool: AITool };
  const rich = TOOL_DETAILS[tool.slug] || ({} as Partial<RichToolDetails>);
  const { user, isBookmarked, toggleBookmark, markVisited } = useApp();
  const { setOpen, setPageContext } = useChat();
  const navigate = useNavigate();
  const bookmarked = isBookmarked(tool.slug);
  const [copied, setCopied] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof rich.useCases>("developers");
  
  // Track selected pipeline step for detailed interactive description
  const [activeStep, setActiveStep] = useState<number>(1);

  // Mark visited + set chatbot context
  useEffect(() => {
    markVisited(tool.slug);
    setPageContext(tool.name);
    return () => setPageContext(null);
  }, [tool.slug, tool.name, markVisited, setPageContext]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(tool.codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const personaIcons: Record<string, React.ReactNode> = {
    individuals: <User className="h-4 w-4" />,
    students: <GraduationCap className="h-4 w-4" />,
    developers: <Terminal className="h-4 w-4" />,
    businesses: <Briefcase className="h-4 w-4" />,
    marketers: <Megaphone className="h-4 w-4" />,
    contentCreators: <Sparkles className="h-4 w-4" />
  };

  const personaTitles: Record<string, string> = {
    individuals: "Individuals",
    students: "Students",
    developers: "Developers",
    businesses: "Businesses",
    marketers: "Marketers",
    contentCreators: "Content Creators"
  };

  return (
    <div className="relative pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[420px] w-[800px] bg-primary/15 blur-[130px] rounded-full -z-10 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 relative">
          <Link to="/tools" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6 transition-all duration-200">
            <ArrowLeft className="h-3 w-3" /> All tools
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="h-24 w-24 rounded-2xl glass-strong flex items-center justify-center text-6xl shadow-glow relative group"
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-2xl group-hover:opacity-20 transition" />
              {tool.logoEmoji}
            </motion.div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">{tool.category}</Badge>
                {rich.subcategory && (
                  <Badge variant="outline" className="border-border/60">{rich.subcategory}</Badge>
                )}
                <Badge variant="outline" className="border-border/60">{tool.pricing}</Badge>
                <Badge variant="outline" className="border-border/60">Since {tool.releaseYear}</Badge>
                {rich.status && (
                  <Badge
                    variant="outline"
                    className={`border-0 text-white ${
                      rich.status === "Active"
                        ? "bg-green-500/20 text-green-400"
                        : rich.status === "Beta"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    ● {rich.status}
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-none text-foreground">{tool.name}</h1>
              <p className="mt-3 text-lg text-muted-foreground max-w-3xl leading-relaxed">{tool.tagline}</p>
              
              <div className="mt-2 text-xs text-muted-foreground/80 flex flex-wrap items-center gap-4 py-1.5">
                {rich.developer && (
                  <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> Developer: <strong>{rich.developer}</strong></span>
                )}
                {rich.launchYear && (
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Launch Year: <strong>{rich.launchYear}</strong></span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Button asChild className="bg-gradient-primary text-primary-foreground border-0 shadow-lg hover:shadow-glow transition-all duration-200">
                  <a href={tool.website} target="_blank" rel="noreferrer">
                    Visit website <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </Button>
                {user && user.role === "client" && (
                  <Button variant="outline" onClick={() => toggleBookmark(tool.slug)} className="border-border/60 backdrop-blur-sm bg-card/40 hover:bg-card/80 transition duration-200">
                    <Bookmark className={`h-4 w-4 mr-1.5 ${bookmarked ? "fill-primary text-primary" : ""}`} />
                    {bookmarked ? "Bookmarked" : "Bookmark"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setOpen(true)} className="border-border/60 backdrop-blur-sm bg-card/40 hover:bg-card/80 transition duration-200">
                  <MessageSquare className="h-4 w-4 mr-1.5" /> Ask about {tool.name}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE DISPLAY - 3-column dashboard layout on desktop */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Tabs defaultValue="overview" className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-8 items-start">
          
          {/* Column 1: Vertical Dashboard Sidebar for Tabs Navigation */}
          <TabsList className="bg-card/60 border border-border/60 flex flex-row lg:flex-col justify-start items-stretch gap-1.5 p-2 rounded-xl backdrop-blur-md h-auto w-full overflow-x-auto lg:overflow-visible flex-nowrap whitespace-nowrap lg:whitespace-normal scrollbar-none shadow-sm">
            <TabsTrigger value="overview" className="justify-start gap-2.5 py-2 px-3.5 lg:py-2.5 lg:px-4 text-xs sm:text-sm lg:w-full shrink-0"><BookOpen className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" /> Overview</TabsTrigger>
            <TabsTrigger value="features" className="justify-start gap-2.5 py-2 px-3.5 lg:py-2.5 lg:px-4 text-xs sm:text-sm lg:w-full shrink-0"><Layers className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" /> Features & Pros</TabsTrigger>
            <TabsTrigger value="use-cases" className="justify-start gap-2.5 py-2 px-3.5 lg:py-2.5 lg:px-4 text-xs sm:text-sm lg:w-full shrink-0"><Activity className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" /> Role-Based Scenarios</TabsTrigger>
            <TabsTrigger value="technical" className="justify-start gap-2.5 py-2 px-3.5 lg:py-2.5 lg:px-4 text-xs sm:text-sm lg:w-full shrink-0"><Terminal className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" /> Tech Specs</TabsTrigger>
            <TabsTrigger value="competitors" className="justify-start gap-2.5 py-2 px-3.5 lg:py-2.5 lg:px-4 text-xs sm:text-sm lg:w-full shrink-0"><Users className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" /> Competitors</TabsTrigger>
            <TabsTrigger value="resources" className="justify-start gap-2.5 py-2 px-3.5 lg:py-2.5 lg:px-4 text-xs sm:text-sm lg:w-full shrink-0"><HelpCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" /> Guides</TabsTrigger>
            <TabsTrigger value="verdict" className="justify-start gap-2.5 py-2 px-3.5 lg:py-2.5 lg:px-4 text-xs sm:text-sm lg:w-full shrink-0"><Zap className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" /> Summary</TabsTrigger>
          </TabsList>

          {/* Column 2: Active Tab Content Panel */}
          <div className="space-y-10 min-w-0 bg-transparent lg:px-2">
            
            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
              <Section title={`About ${tool.name}`}>
                <p className="text-foreground/90 leading-relaxed text-base">{rich.detailedDescription || tool.description}</p>
              </Section>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="glass border-border/60 hover:border-primary/30 transition duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display font-semibold flex items-center gap-1.5 text-primary">
                      <Zap className="h-4 w-4" /> What Problem Does It Solve?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {rich.problemSolved || "Simplifies programmatic interaction and pipeline orchestration within structured AI contexts."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-border/60 hover:border-primary/30 transition duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display font-semibold flex items-center gap-1.5 text-primary">
                      <User className="h-4 w-4" /> Who Is It For?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {rich.targetAudience || "AI developers, backend systems engineers, and practitioners exploring the model stack."}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* DYNAMIC WORKFLOW PIPELINE - Horizontally Scrollable & Selectable Explanation */}
              {rich.workflowSteps && rich.workflowSteps.length > 0 && (
                <Section title="Interactive Execution Pipeline">
                  <div className="p-5 rounded-2xl glass border border-border/60 relative overflow-hidden bg-card/20 w-full">
                    <div className="absolute inset-0 bg-gradient-primary opacity-[0.02] pointer-events-none" />
                    <p className="text-xs text-muted-foreground mb-6">
                      Interactive schema representing how {tool.name} processes data. <strong>Click any stage</strong> to expand its core technical workflow details below:
                    </p>
                    
                    {/* Horizontal scroll container */}
                    <div className="overflow-x-auto pb-4 pt-2 w-full scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                      <div className="flex items-center gap-4 min-w-[850px] px-2">
                        {rich.workflowSteps.map((step, index) => {
                          const colors = {
                            input: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400 focus:shadow-blue-500/10",
                            process: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400 focus:shadow-amber-500/10",
                            model: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400 focus:shadow-purple-500/10",
                            database: "from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400 focus:shadow-cyan-500/10",
                            output: "from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400 focus:shadow-emerald-500/10",
                          };

                          const badgeColors = {
                            input: "bg-blue-500/10 text-blue-400",
                            process: "bg-amber-500/10 text-amber-400",
                            model: "bg-purple-500/10 text-purple-400",
                            database: "bg-cyan-500/10 text-cyan-400",
                            output: "bg-emerald-500/10 text-emerald-400",
                          };

                          const isSelected = activeStep === step.stepNumber;

                          return (
                            <div key={step.stepNumber} className="flex items-center gap-4 relative group shrink-0">
                              {/* The Step Card - Click triggers details card display below */}
                              <motion.div
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveStep(step.stepNumber)}
                                className={`w-[155px] p-4 rounded-xl border bg-gradient-to-br ${colors[step.nodeType]} flex flex-col items-center text-center shadow-md cursor-pointer transition-all relative ${
                                  isSelected ? "ring-2 ring-primary border-primary/90 shadow-glow shadow-primary/20 scale-[1.02]" : "hover:border-primary/50"
                                }`}
                              >
                                <div className={`h-7 w-7 rounded-full bg-black/40 flex items-center justify-center text-xs font-mono font-bold mb-2 transition ${
                                  isSelected ? "bg-primary text-primary-foreground font-black" : ""
                                }`}>
                                  {step.stepNumber}
                                </div>
                                <span className="font-display font-semibold text-xs text-foreground tracking-tight leading-tight line-clamp-2 min-h-[2rem] flex items-center justify-center w-full px-1">{step.title}</span>
                                <Badge className={`mt-2 text-[9px] scale-90 border-0 ${badgeColors[step.nodeType]}`}>
                                  {step.nodeType.toUpperCase()}
                                </Badge>
                                
                                {/* Dark legible hover tooltip */}
                                <div className="absolute bottom-[108%] left-1/2 -translate-x-1/2 w-64 p-3 bg-zinc-950 text-xs text-zinc-300 rounded-lg border border-zinc-800 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 shadow-2xl backdrop-blur">
                                  <strong className="text-white font-semibold block mb-1">Step {step.stepNumber}: {step.title}</strong>
                                  <span className="text-zinc-300 leading-relaxed block">{step.description}</span>
                                </div>
                              </motion.div>

                              {/* Arrow connector */}
                              {index < rich.workflowSteps.length - 1 && (
                                <div className="flex items-center justify-center shrink-0">
                                  <ArrowRight className="h-5 w-5 text-muted-foreground/45 animate-pulse" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step Explorer Detail Box - Explains clicked node dynamically */}
                    <AnimatePresence mode="wait">
                      {activeStep && (
                        <motion.div
                          key={activeStep}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="mt-6 p-5 rounded-xl border border-primary/25 bg-primary/[0.01] relative overflow-hidden backdrop-blur-sm shadow-md"
                        >
                          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-full blur-[45px] -z-10" />
                          <div className="flex gap-2.5 items-center mb-2.5">
                            <div className="h-6 w-6 rounded-full bg-gradient-primary flex items-center justify-center text-[10px] font-mono font-bold text-primary-foreground shadow-glow">
                              {activeStep}
                            </div>
                            <h4 className="font-display font-semibold text-xs sm:text-sm text-foreground">
                              {rich.workflowSteps.find(s => s.stepNumber === activeStep)?.title} Core Logic
                            </h4>
                            <Badge className="ml-auto text-[8px] bg-primary/10 text-primary border-primary/20 border">
                              {rich.workflowSteps.find(s => s.stepNumber === activeStep)?.nodeType.toUpperCase()} STAGE
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {rich.workflowSteps.find(s => s.stepNumber === activeStep)?.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Section>
              )}

              {/* Related Tools - Placed strictly under Overview */}
              <Section title="Related Tools">
                <div className="grid sm:grid-cols-3 gap-3">
                  {tool.related.map((slug) => {
                    const r = TOOLS.find((x) => x.slug === slug);
                    if (!r) return null;
                    return (
                      <Link
                        key={slug}
                        to="/tools/$slug"
                        params={{ slug }}
                        className="rounded-lg border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-glow transition group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-xl shrink-0">{r.logoEmoji}</div>
                          <div>
                            <div className="text-sm font-display font-semibold leading-tight">{r.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{r.category}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Section>
            </TabsContent>

            {/* TAB 2: FEATURES & PROS */}
            <TabsContent value="features" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
              <Section title="Key Technical Features">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rich.keyFeatures ? (
                    rich.keyFeatures.map((feat, i) => (
                      <Card key={feat.name} className="glass border-border/60 hover:border-primary/40 hover:shadow-glow transition duration-300">
                        <CardHeader className="pb-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-xs mb-2">
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <CardTitle className="text-base font-display font-semibold">{feat.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-xs text-foreground/80 leading-relaxed">{feat.description}</p>
                          <div className="text-[11px] text-primary bg-primary/5 border border-primary/10 p-2 rounded leading-relaxed">
                            <strong>Benefit:</strong> {feat.benefits}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    tool.features.map((f, i) => (
                      <Card key={f} className="glass p-4 border-border/60">
                        <div className="text-sm font-semibold">{f}</div>
                      </Card>
                    ))
                  )}
                </div>
              </Section>

              <Section title="Strengths & Technical Limitations">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-green-500/20 bg-green-500/[0.02] p-5">
                    <h4 className="font-display font-semibold text-sm text-green-400 mb-4 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-400" /> Core Strengths (Pros)
                    </h4>
                    <ul className="space-y-3 text-xs sm:text-sm text-foreground/80">
                      {tool.pros.map((p) => (
                        <li key={p} className="flex gap-2.5 items-start">
                          <span className="text-green-500 font-bold mt-0.5">+</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/[0.02] p-5">
                    <h4 className="font-display font-semibold text-sm text-red-400 mb-4 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-red-400" /> Core Limitations (Cons)
                    </h4>
                    <ul className="space-y-3 text-xs sm:text-sm text-foreground/80">
                      {tool.cons.map((c) => (
                        <li key={c} className="flex gap-2.5 items-start">
                          <span className="text-red-500 font-bold mt-0.5">−</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Section>
            </TabsContent>

            {/* TAB 3: ROLE-BASED SCENARIOS */}
            <TabsContent value="use-cases" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
              <Section title="Real-World Persona Scenarios">
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Practitioners use {tool.name} in a variety of contexts. Select a persona below to see how they leverage the tool:
                </p>

                {rich.useCases && (
                  <div className="space-y-6">
                    {/* Persona Selector Chips */}
                    <div className="flex flex-wrap gap-2 border-b border-border/40 pb-4">
                      {(Object.keys(rich.useCases) as Array<keyof typeof rich.useCases>).map((key) => (
                        <button
                          key={key}
                          onClick={() => setSelectedPersona(key)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition duration-200 ${
                            selectedPersona === key
                              ? "bg-gradient-primary border-0 text-white shadow-md shadow-primary/20"
                              : "border-border/60 hover:border-primary/30 bg-card/30 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {personaIcons[key]}
                          {personaTitles[key]}
                        </button>
                      ))}
                    </div>

                    {/* Persona Use Case Detail Card */}
                    <motion.div
                      key={selectedPersona}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass border border-primary/20 bg-primary/[0.01] p-6 rounded-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-full blur-[45px] -z-10" />
                      <div className="flex gap-3 items-center mb-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center">
                          {personaIcons[selectedPersona]}
                        </div>
                        <h4 className="font-display font-semibold text-lg text-foreground">
                          {personaTitles[selectedPersona]} Scenario
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                        {rich.useCases[selectedPersona]}
                      </p>
                    </motion.div>
                  </div>
                )}
              </Section>
            </TabsContent>

            {/* TAB 4: TECH SPECS */}
            <TabsContent value="technical" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
              <Section title="Technical Specifications">
                {rich.technicalDetails && (
                  <div className="rounded-xl border border-border/60 overflow-hidden bg-card/30">
                    <Table>
                      <TableHeader className="bg-card/50">
                        <TableRow>
                          <TableHead className="w-[180px]">Parameter</TableHead>
                          <TableHead>Specification Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-semibold text-xs sm:text-sm">License / Openness</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                              {rich.technicalDetails.openSourceOrProprietary}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold text-xs sm:text-sm">AI Models Employed</TableCell>
                          <TableCell className="text-xs sm:text-sm text-foreground/80">{rich.technicalDetails.modelsUsed}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold text-xs sm:text-sm">API Availability</TableCell>
                          <TableCell className="text-xs sm:text-sm text-foreground/80">{rich.technicalDetails.apiAvailable}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold text-xs sm:text-sm">Supported Languages</TableCell>
                          <TableCell className="flex flex-wrap gap-1">
                            {rich.technicalDetails.supportedLanguages.map((lang) => (
                              <Badge key={lang} variant="outline" className="text-[10px] border-border/60 bg-secondary/30">{lang}</Badge>
                            ))}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold text-xs sm:text-sm">Core Integrations</TableCell>
                          <TableCell className="text-xs sm:text-sm text-foreground/80">{rich.technicalDetails.integrations.join(", ")}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold text-xs sm:text-sm">Platform Availability</TableCell>
                          <TableCell className="text-xs sm:text-sm text-foreground/80">{rich.technicalDetails.platformAvailability.join(", ")}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Section>

              {/* CODE EXAMPLE EDITOR */}
              <Section title="Standard Code Implementation">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Quick-start code script to initialize and invoke the tool within standard environments:
                </p>
                <div className="relative rounded-xl overflow-hidden border border-border/60 bg-card font-mono text-xs">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/60">
                    <span className="text-[10px] text-muted-foreground font-sans flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5 text-primary" /> Active Setup Script</span>
                    <button
                      onClick={copyCode}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/60 hover:bg-secondary transition"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy code"}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-foreground max-h-[380px] bg-muted/20 leading-relaxed font-mono">
                    <code>{tool.codeExample}</code>
                  </pre>
                </div>
              </Section>
            </TabsContent>

            {/* TAB 5: COMPETITORS */}
            <TabsContent value="competitors" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
              {/* COMPETITOR TABLE */}
              <Section title="Competitor Comparison Matrix">
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Direct evaluation matrix comparing {tool.name} against alternative solutions inside the subcategory:
                </p>
                {rich.comparisonTable && (
                  <div className="rounded-xl border border-border/60 overflow-hidden bg-card/30">
                    <Table>
                      <TableHeader className="bg-card/50">
                        <TableRow>
                          <TableHead>Competitor</TableHead>
                          <TableHead>Core Features</TableHead>
                          <TableHead>Ease of Use</TableHead>
                          <TableHead>Pricing</TableHead>
                          <TableHead>API Support</TableHead>
                          <TableHead>Best For</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rich.comparisonTable.map((row) => (
                          <TableRow key={row.competitorName} className={row.competitorName === tool.name ? "bg-primary/[0.04]" : ""}>
                            <TableCell className="font-semibold text-xs sm:text-sm">
                              {row.competitorName} {row.competitorName === tool.name && <span className="text-[10px] text-primary border border-primary/20 rounded px-1 ml-1 font-normal font-sans">Active</span>}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm text-foreground/80">{row.features}</TableCell>
                            <TableCell className="text-xs sm:text-sm text-foreground/80">{row.easeOfUse}</TableCell>
                            <TableCell className="text-xs sm:text-sm text-foreground/80">{row.pricing}</TableCell>
                            <TableCell className="text-xs sm:text-sm text-foreground/80">{row.apiSupport}</TableCell>
                            <TableCell className="text-xs sm:text-sm text-foreground/80 font-medium">{row.bestFor}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Section>

              {/* RATINGS GAUGES */}
              <Section title="User Performance Ratings">
                {rich.userRatings && (
                  <div className="grid sm:grid-cols-2 gap-6 glass p-6 border border-border/60 rounded-xl bg-card/30">
                    {/* Visual bar list */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Ease of Use</span>
                          <span className="text-primary font-bold">{rich.userRatings.easeOfUse} / 5.0</span>
                        </div>
                        <Progress value={(rich.userRatings.easeOfUse / 5) * 100} className="h-2 bg-secondary" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Features Capability</span>
                          <span className="text-primary font-bold">{rich.userRatings.features} / 5.0</span>
                        </div>
                        <Progress value={(rich.userRatings.features / 5) * 100} className="h-2 bg-secondary" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Value for Money</span>
                          <span className="text-primary font-bold">{rich.userRatings.valueForMoney} / 5.0</span>
                        </div>
                        <Progress value={(rich.userRatings.valueForMoney / 5) * 100} className="h-2 bg-secondary" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Customer Support</span>
                          <span className="text-primary font-bold">{rich.userRatings.customerSupport} / 5.0</span>
                        </div>
                        <Progress value={(rich.userRatings.customerSupport / 5) * 100} className="h-2 bg-secondary" />
                      </div>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex flex-col items-center justify-center p-4 border border-border/40 rounded-xl bg-black/20 text-center relative overflow-hidden">
                      <div className="absolute -inset-10 bg-gradient-primary opacity-[0.03] blur-xl" />
                      <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Overall Rating</span>
                      <span className="text-5xl font-display font-bold mt-2 text-gradient leading-none">
                        {rich.userRatings.overallRating}
                      </span>
                      <div className="flex items-center gap-0.5 mt-2.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(rich.userRatings.overallRating) ? "fill-current" : "opacity-30"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">Estimated average rating based on corporate research panels.</p>
                    </div>
                  </div>
                )}
              </Section>

              {/* ALTERNATIVES CARDS */}
              <Section title="Top Alternatives">
                <div className="grid sm:grid-cols-2 gap-4">
                  {rich.alternatives &&
                    rich.alternatives.map((alt) => (
                      <Card key={alt.name} className="glass border-border/60 hover:border-primary/30 transition duration-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-display font-semibold flex justify-between items-center text-foreground">
                            <span>{alt.name}</span>
                            <Badge variant="outline" className="text-[9px] border-border/60">{alt.pricing}</Badge>
                          </CardTitle>
                          <CardDescription className="text-[10px]">{alt.category}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong>Key Difference:</strong> {alt.keyDifference}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </Section>
            </TabsContent>

            {/* TAB 6: GUIDES */}
            <TabsContent value="resources" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
              <Section title="Learning Resources">
                {rich.learningResources && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Card className="glass border-border/60">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs sm:text-sm font-display font-semibold flex items-center gap-1.5 text-primary">
                          <Globe className="h-4 w-4" /> Portals & Communities
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs sm:text-sm text-foreground/80">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <span>Official Documentation</span>
                          <a href={rich.learningResources.documentation} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs inline-flex items-center gap-0.5">
                            Docs <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <span>Community Hub</span>
                          <a href={rich.learningResources.community} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs inline-flex items-center gap-0.5">
                            Join <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>YouTube Portal</span>
                          <a href={rich.learningResources.youtube} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs inline-flex items-center gap-0.5">
                            Watch <Youtube className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass border-border/60">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs sm:text-sm font-display font-semibold flex items-center gap-1.5 text-primary">
                          <Clock className="h-4 w-4" /> Recommended Tutorials
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {rich.learningResources.tutorials.map((t, i) => (
                          <div key={t.title} className="flex justify-between items-start gap-4 text-xs sm:text-sm border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
                            <div className="space-y-0.5">
                              <span className="font-medium text-foreground text-xs leading-tight line-clamp-1">{t.title}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {t.duration} read
                              </span>
                            </div>
                            <a href={t.link} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs shrink-0 flex items-center gap-0.5">
                              Open <ChevronRight className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Section>
            </TabsContent>

            {/* TAB 7: SUMMARY */}
            <TabsContent value="verdict" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
              {rich.summary && (
                <div className="space-y-6">
                  {/* Detailed columns */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-green-500/20 bg-green-500/[0.01] p-5">
                      <h4 className="font-display font-semibold text-xs sm:text-sm text-green-400 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-400" /> Best For
                      </h4>
                      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                        {rich.summary.whoShouldUse}
                      </p>
                    </div>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/[0.01] p-5">
                      <h4 className="font-display font-semibold text-xs sm:text-sm text-red-400 mb-2 flex items-center gap-1.5">
                        <XCircle className="h-4 w-4 text-red-400" /> Not Ideal For
                      </h4>
                      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                        {rich.summary.whoShouldAvoid}
                      </p>
                    </div>
                  </div>

                  {/* Final verdict */}
                  <Card className="glass border-primary/20 bg-gradient-primary/[0.01] relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-primary opacity-5 rounded-full blur-[60px]" />
                    <CardHeader>
                      <CardTitle className="font-display text-lg font-semibold flex items-center gap-1.5 text-primary">
                        <Sparkles className="h-4 w-4" /> Final Verdict
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                        {rich.summary.finalVerdict}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </div>

          {/* Column 3: Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 self-start w-full">
            {/* Rich Pricing Details Card */}
            <Card className="glass border-border/60 p-5 bg-card/30">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-mono mb-3 flex items-center gap-1"><Info className="h-3 w-3" /> Specifications</h4>
              <dl className="space-y-3.5 text-xs sm:text-sm">
                <Row k="Launch Year" v={String(rich.launchYear || tool.releaseYear)} />
                <Row k="Category" v={tool.category} />
                <Row k="Subcategory" v={rich.subcategory || "N/A"} />
                <Row k="Status" v={rich.status || "Active"} />
                <Row k="Popularity" v={`${tool.popularity} / 100`} />
                
                {rich.pricing && (
                  <div className="border-t border-border/40 pt-3 mt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Free Plan</span>
                      <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5">{rich.pricing.freePlanAvailable}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Enterprise Plan</span>
                      <span className="text-xs font-semibold">{rich.pricing.enterprisePlanAvailable}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed bg-black/25 p-2 rounded border border-border/20 mt-1">
                      <strong>Note:</strong> {rich.pricing.pricingNotes}
                    </p>
                  </div>
                )}
              </dl>
            </Card>

            {/* Ask Floating Chatbot */}
            <button
              onClick={() => setOpen(true)}
              className="w-full glass rounded-xl p-4 text-left border border-border/60 hover:border-primary/40 bg-card/30 transition group flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-primary opacity-5 rounded-full blur-[35px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-gradient-primary flex items-center justify-center shrink-0">
                  <MessageSquare className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="text-sm font-display font-semibold group-hover:text-primary transition">Ask AI Assistant</div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">The assistant is loaded with context from this page to answer specific questions about {tool.name}.</p>
            </button>

            <Button
              variant="outline"
              className="w-full border-border/60 backdrop-blur-sm bg-card/30 hover:bg-card/70"
              onClick={() => navigate({ to: "/compare", search: { tools: [tool.slug, tool.related[0]].filter(Boolean).join(",") } })}
            >
              Compare with alternatives
            </Button>
          </aside>
        </Tabs>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="text-xs sm:text-sm font-medium text-foreground">{v}</dd>
    </div>
  );
}
