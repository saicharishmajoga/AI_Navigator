export type Pricing = "Free" | "Freemium" | "Paid" | "Open Source";
export type Category =
  | "LLM Framework"
  | "Vector DB"
  | "Local Inference"
  | "Agent"
  | "RAG"
  | "Fine-tuning"
  | "Embeddings"
  | "Observability";

export interface AITool {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  pricing: Pricing;
  popularity: number; // 0-100
  website: string;
  logoEmoji: string;
  features: string[];
  useCases: string[];
  pros: string[];
  cons: string[];
  tutorials: { title: string; minutes: number }[];
  faqs: { q: string; a: string }[];
  related: string[]; // slugs
  releaseYear: number;
  codeExample: string;
  howItWorks: string;
  overallUse: string;
}

export const TOOLS: AITool[] = [
  {
    slug: "langchain",
    name: "LangChain",
    tagline: "Framework for building LLM-powered applications",
    description:
      "LangChain is a composable open-source framework for developing applications powered by language models, offering modular primitives for chains, agents, memory buffers, and tool interfaces.",
    category: "LLM Framework",
    pricing: "Open Source",
    popularity: 96,
    website: "https://langchain.com",
    logoEmoji: "🦜",
    features: [
      "Composable chains and runnables (LCEL)",
      "Agent abstractions and dynamic tool calling",
      "Memory buffers & conversation persistence",
      "Vast library of 200+ integrations",
      "Deep LangSmith debugging and tracing",
    ],
    useCases: [
      "Complex conversational agents with dynamic tool selection",
      "Multi-document Retrieval-Augmented Generation (RAG)",
      "Automated document summarization pipelines",
      "Self-correcting code generation workflows",
    ],
    pros: ["Massive integration ecosystem", "Highly extensible LCEL syntax", "Huge supportive developer community"],
    cons: ["Slightly steep learning curve", "Frequent library version updates"],
    tutorials: [
      { title: "Build your first LCEL chain", minutes: 8 },
      { title: "Add chat memory to an LLM agent", minutes: 12 },
      { title: "Create a Production RAG pipeline", minutes: 20 },
    ],
    faqs: [
      { q: "Is LangChain free?", a: "Yes — LangChain is fully open-source and free to use. Companion tools like LangSmith offer paid tiers for advanced monitoring." },
      { q: "Which programming languages are supported?", a: "Both Python and JavaScript/TypeScript are officially supported as first-class SDKs." },
    ],
    related: ["llamaindex", "ollama", "pinecone"],
    releaseYear: 2022,
    codeExample: `# Install required libraries
# pip install langchain langchain-openai

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 1. Initialize your LLM client
model = ChatOpenAI(model="gpt-4o", temperature=0.3)

# 2. Design a dynamic system and user prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert AI software architect."),
    ("user", "Explain the concept of {topic} in three key bullets.")
])

# 3. Build a declarative LCEL (LangChain Expression Language) chain
chain = prompt | model | StrOutputParser()

# 4. Invoke the chain synchronously
response = chain.invoke({"topic": "LCEL Prompt Composition"})
print(response)`,
    howItWorks: "LangChain orchestrates AI logic through its LangChain Expression Language (LCEL). Under the hood, LCEL uses a declarative pipes (`|`) syntax to chain components. The output of one module (like a prompt parser) is fed into the input of the next (like an LLM). Components implement standard async, streaming, and batching protocols natively.",
    overallUse: "LangChain is the central operating layer of the LLM application stack. It takes raw prompts, binds them to variables, routes queries through active memory buffers, fetches semantic documents from vector stores, and triggers dynamic external tools when the LLM requests it.",
  },
  {
    slug: "llamaindex",
    name: "LlamaIndex",
    tagline: "Data framework for connecting custom data to LLMs",
    description:
      "LlamaIndex is a data-centric framework optimized for Retrieval-Augmented Generation (RAG). It excels at ingesting, parsing, indexing, and retrieving custom private data sources securely.",
    category: "RAG",
    pricing: "Open Source",
    popularity: 88,
    website: "https://llamaindex.ai",
    logoEmoji: "🦙",
    features: [
      "Advanced document parsers and ingestion engines",
      "Hierarchical index topologies (Vector, Tree, Keyword)",
      "Dynamic query engines and retriever nodes",
      "Sub-question query decomposition pipelines",
      "Grounded RAG performance evaluation tools",
    ],
    useCases: [
      "Securing private enterprise search on internal files",
      "Grounded Q&A chatbots across vast knowledge repositories",
      "Hierarchical catalog and document indexing",
    ],
    pros: ["Outstanding RAG-first architecture", "Pristine document chunking utilities", "Gentle learning curve for search"],
    cons: ["Slightly narrower scope than general frameworks", "Fewer third-party agent tools"],
    tutorials: [
      { title: "Ingest and index local directory documents", minutes: 10 },
      { title: "Build a multi-document query engine", minutes: 15 },
    ],
    faqs: [
      { q: "When should I choose LlamaIndex over LangChain?", a: "Choose LlamaIndex when your primary challenge is retrieving, indexing, and searching highly complex custom documents." },
    ],
    related: ["langchain", "pinecone", "chroma"],
    releaseYear: 2022,
    codeExample: `# Install required libraries
# pip install llama-index llama-index-llms-openai

import os
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.llms.openai import OpenAI

# 1. Configure the environment and active LLM
os.environ["OPENAI_API_KEY"] = "your-api-key"
llm = OpenAI(model="gpt-4", temperature=0.1)

# 2. Ingest custom text documents from a directory
documents = SimpleDirectoryReader("./data").load_data()

# 3. Create a vector index (computes embeddings and indexes nodes)
index = VectorStoreIndex.from_documents(documents)

# 4. Spawn a query engine and search
query_engine = index.as_query_engine(llm=llm)
response = query_engine.query("What are the key points in the Q2 report?")
print(response)`,
    howItWorks: "LlamaIndex splits raw documents into logical 'Nodes', calculates vector embeddings for those nodes, and persists them. During retrieval, a 'Query Engine' matches the user's semantic query against the vector store, fetches the closest matching nodes, and formats them as static context inside the final LLM prompt.",
    overallUse: "LlamaIndex is the absolute gold standard for Retrieval-Augmented Generation (RAG). It provides a secure abstraction that lets developers feed internal documents, spreadsheets, PDFs, or APIs into pre-trained LLMs without exposing private weights or suffering massive context window bills.",
  },
  {
    slug: "ollama",
    name: "Ollama",
    tagline: "Run large language models locally with one command",
    description:
      "Ollama is a local inference platform that bundles model weights, configurations, and system parameters into highly optimized single binaries to run models like Llama 3, Mistral, and Qwen locally.",
    category: "Local Inference",
    pricing: "Free",
    popularity: 92,
    website: "https://ollama.com",
    logoEmoji: "🦙",
    features: [
      "One-command model downloader and launcher",
      "Built-in OpenAI-compatible REST API server",
      "Automatic dynamic GPU and CPU acceleration",
      "Rich official library of 50+ pre-compiled models",
      "Custom model builds via custom Modelfiles",
    ],
    useCases: [
      "Privacy-first offline RAG and chatbot execution",
      "Offline software development and code completion assistants",
      "Zero-cost development prototyping before deploying cloud models",
    ],
    pros: ["Zero-configuration startup", "Extremely fast GPU resource usage", "Beautiful OpenAI api parity"],
    cons: ["Dependent on local GPU hardware memory (VRAM)", "No built-in cloud scalability layer"],
    tutorials: [
      { title: "Install Ollama and run Llama 3 locally", minutes: 5 },
      { title: "Configure local server for VSCode extensions", minutes: 7 },
    ],
    faqs: [
      { q: "Does Ollama require an active GPU?", a: "No. Ollama can fall back to highly optimized CPU thread execution, though a dedicated GPU/VRAM makes inference significantly faster." },
    ],
    related: ["langchain", "lmstudio"],
    releaseYear: 2023,
    codeExample: `# 1. Pull and run a local model via terminal:
# ollama run llama3

# 2. Query the local Ollama API using Python:
import urllib.request
import json

url = "http://localhost:11434/api/generate"
data = {
    "model": "llama3",
    "prompt": "Explain Quantum Computing simply.",
    "stream": False
}

req = urllib.request.Request(
    url, 
    data=json.dumps(data).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

with urllib.request.urlopen(req) as response:
    res = json.loads(response.read().decode("utf-8"))
    print(res["response"])`,
    howItWorks: "Ollama wraps model weight execution in a streamlined C++ llama.cpp backend. It automatically detects GPU architectures (CUDA for NVIDIA, Metal for Apple Silicon) and splits layers between VRAM and system memory dynamically, exposing an asynchronous REST server on port 11434.",
    overallUse: "Ollama is the primary local model runner. It frees developers from expensive API tokens during development, protects enterprise intellectual property through offline local-only RAG pipelines, and powers local AI developer agents on developer laptops.",
  },
  {
    slug: "pinecone",
    name: "Pinecone",
    tagline: "Managed cloud-native vector database for semantic search",
    description:
      "Pinecone is a cloud-managed vector database engineered for real-time similarity search, metadata filtering, and Retrieval-Augmented Generation (RAG) at massive enterprise scale.",
    category: "Vector DB",
    pricing: "Freemium",
    popularity: 85,
    website: "https://pinecone.io",
    logoEmoji: "🌲",
    features: [
      "Serverless dynamic scaling databases",
      "High-recall Approximate Nearest Neighbor (ANN) index",
      "Dynamic metadata filtering and namespaces",
      "Direct API integrations with OpenAI, Cohere, and HF",
      "Ultra-low latency query times under 20ms",
    ],
    useCases: [
      "Enterprise semantic search scaling to billions of vectors",
      "Real-time fraud detection and recommendation systems",
      "Providing long-term memory systems for autonomous agents",
    ],
    pros: ["Zero database maintenance or operations", "Outstanding query response times", "Generous free database tier"],
    cons: ["Proprietary closed-source cloud only", "Can become expensive at massive vector loads"],
    tutorials: [{ title: "Provision a serverless index", minutes: 6 }],
    faqs: [{ q: "Can I run Pinecone locally?", a: "No. Pinecone is a cloud-only managed service. For local vector development, open-source databases like Chroma are recommended." }],
    related: ["chroma", "qdrant", "weaviate"],
    releaseYear: 2019,
    codeExample: `# Install required database package
# pip install pinecone-client

from pinecone import Pinecone, ServerlessSpec

# 1. Initialize client
pc = Pinecone(api_key="your-api-key")

# 2. Create a serverless index
index_name = "ai-navigator-index"
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=1536, # matching OpenAI embeddings
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )

# 3. Connect to the index and upsert vector data
index = pc.Index(index_name)
vectors = [
    ("id1", [0.1] * 1536, {"genre": "comedy"}),
    ("id2", [0.2] * 1536, {"genre": "action"})
]
index.upsert(vectors)

# 4. Search similarity
results = index.query(vector=[0.1] * 1536, top_k=1, include_metadata=True)
print(results)`,
    howItWorks: "Pinecone stores multidimensional floating-point vector arrays inside specialized cloud indexes. When queried with an embedding, it searches through its Approximate Nearest Neighbor tree (using HNSW or serverless metric engines), applies metadata filters instantly, and returns the closest IDs and payloads.",
    overallUse: "Pinecone serves as the long-term memory layer in large enterprise cloud RAG pipelines. It decouples high-performance vector lookup from application servers, allowing applications to persist and retrieve millions of context pages instantly.",
  },
  {
    slug: "chroma",
    name: "ChromaDB",
    tagline: "Open-source local-first embedding database",
    description:
      "Chroma is a light, developer-focused, open-source vector database designed to make building local AI apps with embeddings simple and zero-configuration.",
    category: "Vector DB",
    pricing: "Open Source",
    popularity: 78,
    website: "https://trychroma.com",
    logoEmoji: "🔮",
    features: [
      "Zero-config local storage persistent database",
      "First-class SDK support for Python and JavaScript",
      "Flexible built-in embedding functions",
      "Rich search with metadata filters",
    ],
    useCases: [
      "Local desktop RAG applications",
      "Prototyping and offline vector indexing",
      "Embedded vector database inside client applications",
    ],
    pros: ["Free, open-source, and offline", "Easy setup with single install", "Excellent developer experience"],
    cons: ["Requires manual configuration for distributed cloud scaling"],
    tutorials: [{ title: "Embed text and query Chroma locally", minutes: 9 }],
    faqs: [{ q: "Is Chroma production-ready?", a: "Yes. Chroma can be run in client-server mode dockerized or managed via their upcoming cloud service." }],
    related: ["pinecone", "qdrant", "langchain"],
    releaseYear: 2022,
    codeExample: `# Install required libraries
# pip install chromadb

import chromadb

# 1. Initialize local persistent client
client = chromadb.PersistentClient(path="./local_chroma_db")

# 2. Get or create collection
collection = client.get_or_create_collection(name="tools_directory")

# 3. Add plain text documents (Chroma embeds them automatically)
collection.add(
    documents=["LangChain is an LLM framework.", "Chroma is a local vector DB."],
    metadatas=[{"type": "framework"}, {"type": "database"}],
    ids=["doc1", "doc2"]
)

# 4. Search by semantic query
results = collection.query(
    query_texts=["Where do I store embeddings?"],
    n_results=1
)
print(results["documents"])`,
    howItWorks: "Chroma stores raw text and embeddings in a SQLite index combined with HNSW library directories for vector searches. It abstracts the entire vector calculations loop: if text is passed directly, it uses default embedding clients to calculate and insert values automatically.",
    overallUse: "Chroma is the ultimate local-first vector database. It is the primary database for developers looking to build local prototypes, offline companion tools, or embedded client tools that operate entirely within local memory environments.",
  },
  {
    slug: "huggingface",
    name: "Hugging Face",
    tagline: "The platform and community for open-source AI models",
    description:
      "Hugging Face is the central hub for the open AI ecosystem. It hosts millions of models, datasets, and demo spaces, alongside libraries like Transformers.",
    category: "LLM Framework",
    pricing: "Freemium",
    popularity: 98,
    website: "https://huggingface.co",
    logoEmoji: "🤗",
    features: [
      "Model repository scaling to over 500k models",
      "Standardized datasets directory for research models",
      "Transformers, Diffusers, and PEFT open-source libraries",
      "Spaces for hosting interactive Gradio/Streamlit demos",
      "Instant Serverless Inference API endpoints",
    ],
    useCases: [
      "Discovering and downloading public model weights",
      "Fine-tuning large language models and diffusion systems",
      "Deploying instant inference nodes for open models",
    ],
    pros: ["Vast community model catalog", "First-class model libraries", "Outstanding free model spaces"],
    cons: ["Quality can vary widely across public community repositories"],
    tutorials: [{ title: "Deploy a model pipeline in 5 lines", minutes: 5 }],
    faqs: [{ q: "Are Hugging Face models free?", a: "Yes, public model weights are free to download. Premium server hosting and private repositories have paid tiers." }],
    related: ["langchain", "ollama"],
    releaseYear: 2016,
    codeExample: `# Install required libraries
# pip install transformers torch

from transformers import pipeline

# 1. Initialize a sentiment classification pipeline
# (Downloads weights automatically on first execution)
classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

# 2. Execute inference
result = classifier("I love building AI workflows with open-source tools!")
print(result)

# Output: [{'label': 'POSITIVE', 'score': 0.9998}]`,
    howItWorks: "Hugging Face acts as the Git repository system for model weights. The `transformers` library abstracts model configuration and execution: it handles downloading model tensors, tokenizing input strings into numerical indexes, running tensor multiplication, and decoding outputs.",
    overallUse: "Hugging Face is the infrastructure provider of open-source AI. It is where models are released, cataloged, and hosted, giving developers open access to model architectures without proprietary platform gatekeeping.",
  },
  {
    slug: "autogen",
    name: "AutoGen",
    tagline: "Multi-agent conversation framework by Microsoft",
    description:
      "AutoGen is a premium developer framework that enables building complex LLM applications using multiple cooperating agents that converse with each other.",
    category: "Agent",
    pricing: "Open Source",
    popularity: 82,
    website: "https://microsoft.github.io/autogen",
    logoEmoji: "🤝",
    features: [
      "Multi-agent conversation orchestration architecture",
      "Polished human-in-the-loop validation tools",
      "Native dockerized shell code execution environments",
      "Highly customizable agent classes",
    ],
    useCases: [
      "Autonomous coding and debugging agent crews",
      "Complex interactive workflow simulation",
      "Orchestrating agent-based business processes",
    ],
    pros: ["Extremely powerful multi-agent patterns", "Robust code-execution security", "Microsoft research backing"],
    cons: ["Can consume substantial tokens in long conversation loops"],
    tutorials: [{ title: "Configure a two-agent developer chat", minutes: 12 }],
    faqs: [{ q: "Do I need an OpenAI key?", a: "No. AutoGen supports any OpenAI-compatible API, including local models hosted via Ollama." }],
    related: ["langchain", "crewai"],
    releaseYear: 2023,
    codeExample: `# Install agent library
# pip install pyautogen

import autogen

# 1. Configure the LLM parameters
config_list = [{"model": "gpt-4", "api_key": "your-api-key"}]

# 2. Define the Assistant Agent
assistant = autogen.AssistantAgent(
    name="coder",
    llm_config={"config_list": config_list}
)

# 3. Define the User Proxy Agent (executes code locally)
user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    code_execution_config={"work_dir": "coding", "use_docker": False},
    human_input_mode="NEVER"
)

# 4. Initiate conversation
user_proxy.initiate_chat(
    assistant,
    message="Write a python function to calculate fibonacci."
)`,
    howItWorks: "AutoGen manages conversation loops between class instances. Agents are defined with specific prompt rules. When one agent outputs text, the User Proxy parses it: if the output contains a code block, it executes it locally and feeds the terminal output back to the agent.",
    overallUse: "AutoGen is the premier framework for building complex agentic systems. It enables building software development crews, autonomous analysts, or business managers where agents collaborate, double-check work, and execute actual system scripts.",
  },
  {
    slug: "qdrant",
    name: "Qdrant",
    tagline: "High-performance vector search engine in Rust",
    description: "Qdrant is a high-performance vector similarity search engine and database written in Rust, engineered for production RAG environments.",
    category: "Vector DB",
    pricing: "Open Source",
    popularity: 80,
    website: "https://qdrant.tech",
    logoEmoji: "🟣",
    features: ["Rust-powered extreme search speeds", "Advanced payload filtering", "Fast distributed search metrics"],
    useCases: ["Production cloud RAG scaling", "Massive corporate search systems"],
    pros: ["Extremely low latency search", "Frugal memory footprint", "Excellent client SDKs"],
    cons: ["Slightly steeper learning curve than simple local vector databases"],
    tutorials: [{ title: "Configure local Qdrant server", minutes: 8 }],
    faqs: [{ q: "Is Qdrant free?", a: "Yes, it is open source. Qdrant Cloud has paid premium tiers." }],
    related: ["pinecone", "chroma"],
    releaseYear: 2021,
    codeExample: `# Install qdrant client
# pip install qdrant-client

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# 1. Connect to local memory engine
client = QdrantClient(":memory:")

# 2. Configure a new collection
client.create_collection(
    collection_name="products",
    vectors_config=VectorParams(size=4, distance=Distance.COSINE),
)

# 3. Insert point vectors
operation_info = client.upsert(
    collection_name="products",
    wait=True,
    points=[
        PointStruct(id=1, vector=[0.05, 0.61, 0.76, 0.74], payload={"city": "Berlin"}),
    ],
)
print("Point inserted successfully.")`,
    howItWorks: "Qdrant compiles vectors into a high-performance Rust framework using advanced quantization configurations. It combines similarity indexes (like HNSW) with filter payload indices, providing highly optimized search speeds.",
    overallUse: "Qdrant is perfect for high-traffic enterprise RAG platforms. It handles millions of queries, manages metadata payload filtering, and guarantees ultra-low latencies under high user loads.",
  },
  {
    slug: "weaviate",
    name: "Weaviate",
    tagline: "AI-native vector search engine with GraphQL APIs",
    description: "Weaviate is an open-source, AI-native vector database designed to simplify generative search, data vectorization, and similarity retrieval.",
    category: "Vector DB",
    pricing: "Freemium",
    popularity: 76,
    website: "https://weaviate.io",
    logoEmoji: "🧭",
    features: ["Built-in vectorizer modules", "GraphQL query structure support", "Multi-tenancy capabilities"],
    useCases: ["Enterprise semantic search", "Automated context lookup"],
    pros: ["Excellent auto-vectorization", "Flexible modular plugins"],
    cons: ["Slightly complex deployment parameters compared to lightweight tools"],
    tutorials: [{ title: "Index objects using GraphQL", minutes: 11 }],
    faqs: [{ q: "What metric does Weaviate use?", a: "It supports Cosine, Dot Product, and L2 distances." }],
    related: ["pinecone", "qdrant"],
    releaseYear: 2019,
    codeExample: `# Install client library
# pip install weaviate-client

import weaviate

# 1. Connect to Weaviate local client
client = weaviate.Client("http://localhost:8080")

# 2. Add vector data
uuid = client.data_object.create({
    "name": "Weaviate database",
    "description": "AI-native open-source vector store"
}, "ToolClass")
print(f"Object created with UUID: {uuid}")`,
    howItWorks: "Weaviate combines schema classes with automated text vectorizers. When you index text, it automatically triggers your selected embedding model, saves the vectors, and makes them retrievable using GraphQL semantic structures.",
    overallUse: "Weaviate acts as an AI-native search engine. It abstracts raw vector calculations entirely, allowing enterprise developers to define schemas and search database entries natively in GraphQL formats.",
  },
  {
    slug: "crewai",
    name: "CrewAI",
    tagline: "Framework for orchestrating role-playing collaborative agents",
    description: "CrewAI enables building highly collaborative AI agent teams where agents are assigned specific roles, individual goals, and target tasks.",
    category: "Agent",
    pricing: "Open Source",
    popularity: 79,
    website: "https://crewai.com",
    logoEmoji: "⛵",
    features: ["Role-based agent design", "Hierarchical task delegation", "Process workflow models"],
    useCases: ["Automated marketing teams", "Autonomous research crews", "Data gathering crews"],
    pros: ["Highly intuitive code abstractions", "Outstanding role-playing agent dynamics"],
    cons: ["Slightly newer ecosystem with active changes"],
    tutorials: [{ title: "Set up a content team crew", minutes: 10 }],
    faqs: [{ q: "Can I run it locally?", a: "Yes, CrewAI is fully compatible with local LLMs hosted via Ollama." }],
    related: ["autogen", "langchain"],
    releaseYear: 2024,
    codeExample: `# Install crewai library
# pip install crewai

from crewai import Agent, Task, Crew, Process

# 1. Define active agents
researcher = Agent(
    role="Senior AI Researcher",
    goal="Discover emerging AI technologies",
    backstory="You are an elite researcher passionate about emerging tech.",
    verbose=True
)

# 2. Assign tasks
task1 = Task(
    description="Analyze 2026 trending AI frameworks.",
    agent=researcher,
    expected_output="A bulleted summary list."
)

# 3. Assemble crew
crew = Crew(
    agents=[researcher],
    tasks=[task1],
    process=Process.sequential
)
result = crew.kickoff()
print(result)`,
    howItWorks: "CrewAI organizes agent loops sequentially or hierarchically. Agents receive distinct personalities via prompts ('backstories' and 'goals'), select assigned tasks, call active tools, and automatically pass task deliverables to sibling agents.",
    overallUse: "CrewAI is perfect for collaborative workflows. It allows businesses to automate complex departments (like research, content generation, and customer service ticket routing) by modeling them as cooperating digital crews.",
  },
  {
    slug: "lmstudio",
    name: "LM Studio",
    tagline: "Sleek desktop app for running offline LLMs",
    description: "LM Studio is a beautiful desktop application designed to easily download, test, and chat with local open-source models offline.",
    category: "Local Inference",
    pricing: "Free",
    popularity: 74,
    website: "https://lmstudio.ai",
    logoEmoji: "🎛️",
    features: ["Polished desktop GUI chat", "Zero-config model downloader", "Local OpenAI-compatible API"],
    useCases: ["Offline AI chat companion", "Local LLM prototyping and fine-tuning"],
    pros: ["Extremely polished UI", "Highly beginner-friendly", "Excellent model browsing"],
    cons: ["Closed-source application core"],
    tutorials: [{ title: "Deploy your first local model", minutes: 4 }],
    faqs: [{ q: "Is it open-source?", a: "No, LM Studio is proprietary closed-source, though free to use for personal developer projects." }],
    related: ["ollama"],
    releaseYear: 2023,
    codeExample: `# 1. Download LM Studio from lmstudio.ai
# 2. Click search icon, download Qwen-2.5-Coder GGUF model
# 3. Click the local server icon, start the server on port 1234
# 4. Request the local server using standard OpenAI client:

from openai import OpenAI

client = OpenAI(base_url="http://localhost:1234/v1", api_key="not-needed")

completion = client.chat.completions.create(
  model="local-model", # matches whichever model is loaded in LM Studio
  messages=[{"role": "user", "content": "Explain server ports."}]
)
print(completion.choices[0].message.content)`,
    howItWorks: "LM Studio provides a highly optimized Electron desktop wrap around llama.cpp inference engines. It connects directly to Hugging Face Hub to download models in GGUF formatting and hosts an active local server on port 1234.",
    overallUse: "LM Studio is the ultimate GUI runner for local models. It provides a visual chat playground for developers and business users looking to interact with open models without writing a single line of terminal code.",
  },
  {
    slug: "langsmith",
    name: "LangSmith",
    tagline: "Production-grade observability and tracing for LLM apps",
    description: "LangSmith is a cloud platform built by LangChain to debug, evaluate, test, monitor, and gain full visibility into LLM chains and agents in production.",
    category: "Observability",
    pricing: "Freemium",
    popularity: 81,
    website: "https://smith.langchain.com",
    logoEmoji: "🔍",
    features: ["Automatic step-by-step chain tracing", "Grounded prompt test evaluations", "Production model metrics tracking"],
    useCases: ["Debugging complex agent loops", "Comparing LLM latency and token costs in production"],
    pros: ["Seamless LangChain integration", "Polished and informative telemetry dashboard"],
    cons: ["Best utilized when paired with LangChain-based applications"],
    tutorials: [{ title: "Trace your first chain run", minutes: 6 }],
    faqs: [{ q: "Does it capture all logs?", a: "Yes, it tracks complete prompts, intermediate outputs, tool results, and execution latency." }],
    related: ["langchain"],
    releaseYear: 2023,
    codeExample: `import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# 1. Configure LangSmith credentials (auto-intercepts execution)
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-key"
os.environ["LANGCHAIN_PROJECT"] = "AI Navigator telemetry"

# 2. Run standard LangChain call (telemetry is captured automatically)
model = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_template("Explain {topic} in one line.")
chain = prompt | model
chain.invoke({"topic": "LangSmith tracing"})`,
    howItWorks: "LangSmith operates via background API intercepts. When LangChain classes run, they emit background execution logs (input parameters, model temperature, output tokens, time elapsed) to the LangSmith cloud backend, compiling complete visual trace graphs.",
    overallUse: "LangSmith is the observability layer of the modern AI engineering stack. It gives engineers total visibility inside nested agent loops, letting them identify failing tool integrations, diagnose slow steps, and prevent model rate limits.",
  },
];

export const CATEGORIES: Category[] = [
  "LLM Framework",
  "Vector DB",
  "Local Inference",
  "Agent",
  "RAG",
  "Fine-tuning",
  "Embeddings",
  "Observability",
];

export const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "ML Engineer @ Stripe",
    body: "AI Navigator saved me weeks of evaluation. The comparison view is exactly what the AI ecosystem needed.",
  },
  {
    name: "Marcus Webb",
    role: "Founder @ Lumen AI",
    body: "Finally a place that treats AI tools as a learnable space, not a hype feed. The chatbot is genuinely useful.",
  },
  {
    name: "Priya Raman",
    role: "Research Engineer",
    body: "The depth of each tool page is exceptional. It feels handcrafted, not autogenerated.",
  },
];

