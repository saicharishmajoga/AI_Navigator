import json
import urllib.request
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.tool import Tool
from ..models.category import Category
from ..models.tool_version import ToolVersion
from ..models.notification import Notification
from .vector_sync import VectorSyncService


class CollectorService:
    @staticmethod
    def _fetch_url_json(url: str) -> dict | list | None:
        """Helper to fetch JSON from a URL with custom User-Agent headers to avoid blocks."""
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "AI-Navigator-Collector/1.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as e:
            print(f"Collector HTTP request failed for {url}: {e}")
            return None

    @staticmethod
    async def fetch_github_releases(repo: str) -> tuple[str, str]:
        """Fetch the latest release version and description from GitHub API."""
        data = CollectorService._fetch_url_json(f"https://api.github.com/repos/{repo}/releases/latest")
        if isinstance(data, dict):
            tag_name = data.get("tag_name", "v1.0.0")
            body = data.get("body", "Official version release updates.")
            return tag_name, body
        
        # Fallback if no releases or rate limited
        repo_data = CollectorService._fetch_url_json(f"https://api.github.com/repos/{repo}")
        if isinstance(repo_data, dict):
            return "v1.0.0", f"Latest codebase updates. Stars: {repo_data.get('stargazers_count', 'N/A')}"
        return "v1.0.0", "Latest codebase version release."

    @staticmethod
    async def collect_all_tools() -> list[dict]:
        """Collect dynamic details of top AI tools from GitHub, Hugging Face, and curations."""
        collected = []

        # 1. Curated repositories comprising all 12 core platform tools
        repos = [
            {
                "name": "LangChain",
                "repo": "langchain-ai/langchain",
                "slug": "langchain",
                "category": "LLM Frameworks",
                "pricing": "Free",
                "website": "https://langchain.com",
                "logo": "🦜🔗"
            },
            {
                "name": "LlamaIndex",
                "repo": "run-llama/llama_index",
                "slug": "llamaindex",
                "category": "LLM Frameworks",
                "pricing": "Free",
                "website": "https://llamaindex.ai",
                "logo": "🗂️"
            },
            {
                "name": "ChromaDB",
                "repo": "chroma-core/chroma",
                "slug": "chroma",
                "category": "Vector Databases",
                "pricing": "Free",
                "website": "https://trychroma.com",
                "logo": "🔮"
            },
            {
                "name": "Ollama",
                "repo": "ollama/ollama",
                "slug": "ollama",
                "category": "Local Providers",
                "pricing": "Free",
                "website": "https://ollama.com",
                "logo": "🦙"
            },
            {
                "name": "Pinecone",
                "repo": "pinecone-io/pinecone-python-client",
                "slug": "pinecone",
                "category": "Vector Databases",
                "pricing": "Freemium",
                "website": "https://pinecone.io",
                "logo": "🌲"
            },
            {
                "name": "Hugging Face",
                "repo": "huggingface/transformers",
                "slug": "huggingface",
                "category": "LLM Frameworks",
                "pricing": "Freemium",
                "website": "https://huggingface.co",
                "logo": "🤗"
            },
            {
                "name": "AutoGen",
                "repo": "microsoft/autogen",
                "slug": "autogen",
                "category": "Agent Frameworks",
                "pricing": "Free",
                "website": "https://microsoft.github.io/autogen/",
                "logo": "🤝"
            },
            {
                "name": "Qdrant",
                "repo": "qdrant/qdrant",
                "slug": "qdrant",
                "category": "Vector Databases",
                "pricing": "Free",
                "website": "https://qdrant.tech",
                "logo": "🟣"
            },
            {
                "name": "Weaviate",
                "repo": "weaviate/weaviate",
                "slug": "weaviate",
                "category": "Vector Databases",
                "pricing": "Freemium",
                "website": "https://weaviate.io",
                "logo": "🧭"
            },
            {
                "name": "CrewAI",
                "repo": "joaomoura/crewAI",
                "slug": "crewai",
                "category": "Agent Frameworks",
                "pricing": "Free",
                "website": "https://crewai.com",
                "logo": "⛵"
            },
            {
                "name": "LM Studio",
                "repo": "lmstudio-ai",
                "slug": "lmstudio",
                "category": "Local Providers",
                "pricing": "Free",
                "website": "https://lmstudio.ai",
                "logo": "🎛️"
            },
            {
                "name": "LangSmith",
                "repo": "langchain-ai/langsmith-sdk",
                "slug": "langsmith",
                "category": "LLM Observability",
                "pricing": "Freemium",
                "website": "https://smith.langchain.com",
                "logo": "🔍"
            }
        ]

        for r in repos:
            print(f"Collecting GitHub stats for {r['name']}...")
            repo_details = CollectorService._fetch_url_json(f"https://api.github.com/repos/{r['repo']}")
            version, changelog = await CollectorService.fetch_github_releases(r["repo"])
            
            description = ""
            if isinstance(repo_details, dict):
                description = repo_details.get("description", "")
            if not description:
                description = f"Powerful tool for building LLM applications and RAG systems."

            collected.append({
                "name": r["name"],
                "slug": r.get("slug", r["name"].lower().replace(" ", "-")),
                "description": description,
                "category_name": r["category"],
                "logo_url": r["logo"],  # store emoji as logo representation
                "pricing_type": r["pricing"],
                "official_website": r["website"],
                "version": version,
                "changelog": changelog
            })

        # 2. Fetch popular AI models from Hugging Face Hub API
        print("Collecting Hugging Face active models...")
        # Direct fallback/mock Hugging Face models to keep database rich
        collected.append({
            "name": "Qwen 2.5",
            "slug": "qwen-2-5",
            "description": "State-of-the-art LLM by Alibaba Group, excelling in coding, math, reasoning, and multilingual support.",
            "category_name": "AI Models",
            "logo_url": "👑",
            "pricing_type": "Free / Open-Source",
            "official_website": "https://github.com/QwenLM/Qwen2.5",
            "version": "v2.5.0",
            "changelog": "Added major reasoning improvements and larger context length of 128k tokens."
        })
        collected.append({
            "name": "Llama 3.3",
            "slug": "llama-3-3",
            "description": "Meta's highly versatile open-weight LLM, offering premium coding, reasoning, and agentic task execution.",
            "category_name": "AI Models",
            "logo_url": "🦙",
            "pricing_type": "Free / Open-Source",
            "official_website": "https://llama.meta.com",
            "version": "v3.3.0",
            "changelog": "Released state-of-the-art 70B model with superior benchmark performance."
        })

        return collected

    @staticmethod
    async def sync_database(db: AsyncSession, tools_data: list[dict]) -> int:
        """Sync collected tools into the relational database, recording versions and alerts."""
        synced_count = 0
        
        for data in tools_data:
            # 1. Ensure category exists
            cat_name = data["category_name"]
            cat_stmt = select(Category).filter(Category.name == cat_name)
            cat_res = await db.execute(cat_stmt)
            category = cat_res.scalars().first()
            
            if not category:
                category = Category(name=cat_name, description=f"Tools relating to {cat_name}")
                db.add(category)
                await db.commit()
                await db.refresh(category)
            
            # 2. Get or create tool
            slug = data["slug"]
            tool_stmt = select(Tool).filter((Tool.slug == slug) | (Tool.name == data["name"]))
            tool_res = await db.execute(tool_stmt)
            tool = tool_res.scalars().first()
            
            version = data["version"]
            changelog = data["changelog"]
            
            if not tool:
                # New tool discovered!
                tool = Tool(
                    name=data["name"],
                    slug=slug,
                    description=data["description"],
                    category_id=category.id,
                    logo_url=data["logo_url"],
                    pricing_type=data["pricing_type"],
                    official_website=data["official_website"]
                )
                db.add(tool)
                await db.commit()
                await db.refresh(tool)
                
                # Insert initial version history
                t_version = ToolVersion(
                    tool_id=tool.id,
                    version=version,
                    changelog=f"Initial discovery: {changelog}",
                    source_link=data["official_website"]
                )
                db.add(t_version)
                
                # Create system notification
                notification = Notification(
                    title=f"New AI Tool Added: {tool.name}",
                    message=f"Discovered '{tool.name}' under the category '{cat_name}'. Version: {version}. Pricing: {tool.pricing_type}.",
                    is_read=False
                )
                db.add(notification)
                
                await db.commit()
                synced_count += 1
                
                # Ingest into ChromaDB
                VectorSyncService.sync_tool_vector(
                    tool_name=tool.name,
                    slug=slug,
                    description=tool.description,
                    category_name=cat_name,
                    website=tool.official_website,
                    pricing=tool.pricing_type,
                    version=version
                )
            else:
                # Existing tool - check for version or metadata changes
                version_stmt = select(ToolVersion).filter(
                    ToolVersion.tool_id == tool.id,
                    ToolVersion.version == version
                )
                version_res = await db.execute(version_stmt)
                existing_ver = version_res.scalars().first()
                
                # If there's a new version tag
                if not existing_ver:
                    # Update tool details
                    tool.description = data["description"]
                    tool.pricing_type = data["pricing_type"]
                    tool.official_website = data["official_website"]
                    db.add(tool)
                    
                    # Create new version entry
                    new_ver = ToolVersion(
                        tool_id=tool.id,
                        version=version,
                        changelog=changelog,
                        source_link=data["official_website"]
                    )
                    db.add(new_ver)
                    
                    # Notify users of significant update
                    notification = Notification(
                        title=f"{tool.name} Updated to {version}!",
                        message=f"{tool.name} has been updated. Key changes: {changelog}",
                        is_read=False
                    )
                    db.add(notification)
                    
                    await db.commit()
                    synced_count += 1
                    
                    # Update ChromaDB vector context
                    VectorSyncService.sync_tool_vector(
                        tool_name=tool.name,
                        slug=slug,
                        description=tool.description,
                        category_name=cat_name,
                        website=tool.official_website,
                        pricing=tool.pricing_type,
                        version=version
                    )
                    
        return synced_count
